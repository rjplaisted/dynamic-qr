<script setup lang="ts">
import { formatTimeAgo } from "@vueuse/core";
import moment from "moment";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Icon } from "@iconify/vue";

import type { Link } from "@/interfaces";
import { downloadLinkQrSvg, downloadLinkQrPng } from "@/api";
import VisitsDialog from './VisitsDialog.vue';

defineProps<{
  link: Link
}>();

const downloadBlob = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

const onDownloadSvg = async (link: Link) => {
  const res = await downloadLinkQrSvg(link._id);
  downloadBlob(res.data as Blob, `qr-${link._id}.svg`);
};

const onDownloadPng = async (link: Link) => {
  const res = await downloadLinkQrPng(link._id);
  downloadBlob(res.data as Blob, `qr-${link._id}.png`);
};
</script>

<template>
  <Card class="w-full h-fit">
    <CardHeader class="pb-4">
      <CardTitle class="flex space-x-1">
        <span class="w-full truncate">
          {{ link.title }}
        </span>
        <Icon :icon="link.isPrivate ? 'radix-icons:lock-closed' : 'radix-icons:lock-open-1'" />
      </CardTitle>
      <CardDescription class="flex items-center space-x-1">
        <Icon icon="radix-icons:link-2" />
        <p>{{ link.shortUrl }}</p>
      </CardDescription>
    </CardHeader>
    <CardContent class="py-0 flex space-x-2 justify-between" :class="link.qrCode ? 'h-auto' : 'h-28'">
      <div class="flex flex-col gap-y-1">
        <p class="inline-flex text-sm font-medium items-center gap-1">
          Original URL
        </p>
        <small class="text-sm text-muted-foreground break-all line-clamp-4">
            {{ link.originUrl }}
        </small>
      </div>

      <div v-if="link.qrCode" class="flex flex-col items-center gap-1.5 flex-shrink-0">
        <img :src="link.qrCode" alt="qr-code" class="w-auto h-24"/>
        <div class="flex gap-1">
          <Button
            variant="outline"
            size="sm"
            class="h-6 px-2 text-xs gap-1"
            @click="onDownloadPng(link)"
            title="Download PNG"
          >
            <Icon icon="radix-icons:download" class="h-3 w-3" />
            PNG
          </Button>
          <Button
            variant="outline"
            size="sm"
            class="h-6 px-2 text-xs gap-1"
            @click="onDownloadSvg(link)"
            title="Download SVG vector"
          >
            <Icon icon="radix-icons:download" class="h-3 w-3" />
            SVG
          </Button>
        </div>
      </div>
      <img v-else src="/src/assets/error/no-picture.png" alt="no-qr-code" class="w-auto h-24"/>
    </CardContent>
    <CardFooter class="bottom-0 py-4">
      <small class="inline-flex items-center text-muted-foreground gap-2">
        <VisitsDialog :link-id="link._id" :visit-count="link.visitCount" />
        <Icon icon="radix-icons:divider-horizontal" />
        {{ formatTimeAgo(new Date(moment.utc().format(link.updatedAt))) }}
      </small>
    </CardFooter>
  </Card>
</template>
