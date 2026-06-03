import { UrlDB } from '../models';
import { logTimestamp } from '../utils/log';

interface GeoJob {
  urlId: string;
  ip: string;
  visitAt: Date;
}

// Stay safely under ip-api.com's 45 req/min free limit
const INTERVAL_MS = Math.ceil(60_000 / 45); // ~1334ms between requests

const queue: GeoJob[] = [];
let processing = false;

const sleep = (ms: number) => new Promise<void>(r => setTimeout(r, ms));

const isPrivate = (ip: string) =>
  !ip || ip === 'unknown' || ip === '127.0.0.1' || ip === '::1' ||
  ip.startsWith('10.') || ip.startsWith('192.168.') ||
  /^172\.(1[6-9]|2\d|3[01])\./.test(ip) ||
  ip.startsWith('fc') || ip.startsWith('fd');

const fetchGeo = async (ip: string) => {
  const res = await fetch(
    `http://ip-api.com/json/${ip}?fields=status,country,regionName,city`,
    { signal: AbortSignal.timeout(5000) },
  );
  return res.json() as Promise<{ status: string; country?: string; regionName?: string; city?: string }>;
};

const processJob = async (job: GeoJob) => {
  let country = '', city = '', region = '', geoStatus = 'done';

  if (isPrivate(job.ip)) {
    // Private/local IP — no lookup possible, mark done with empty fields
  } else {
    try {
      const data = await fetchGeo(job.ip);
      if (data.status === 'success') {
        country = data.country ?? '';
        city    = data.city ?? '';
        region  = data.regionName ?? '';
      } else {
        geoStatus = 'failed';
      }
    } catch {
      geoStatus = 'failed';
    }
  }

  try {
    await UrlDB.updateOne(
      { _id: job.urlId },
      {
        $set: {
          'visits.$[v].country':   country,
          'visits.$[v].city':      city,
          'visits.$[v].region':    region,
          'visits.$[v].geoStatus': geoStatus,
        },
      },
      { arrayFilters: [{ 'v.ip': job.ip, 'v.at': job.visitAt, 'v.geoStatus': 'queued' }] },
    );
  } catch (err) {
    logTimestamp(`geo.queue update failed for ${job.urlId}: ${(err as Error).message}`);
  }
};

const runQueue = async () => {
  processing = true;
  while (queue.length > 0) {
    const job = queue.shift()!;
    await processJob(job);
    if (queue.length > 0) await sleep(INTERVAL_MS);
  }
  processing = false;
};

export const enqueueGeoLookup = (urlId: string, ip: string, visitAt: Date) => {
  queue.push({ urlId, ip, visitAt });
  if (!processing) runQueue();
};

export const geoQueueLength = () => queue.length;
