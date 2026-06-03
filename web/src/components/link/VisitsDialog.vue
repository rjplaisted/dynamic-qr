<script setup lang="ts">
import { ref } from 'vue';
import { Icon } from '@iconify/vue';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import type { Visit } from '@/interfaces';
import { fetchLinkVisits } from '@/api';

const props = defineProps<{
  linkId: string;
  visitCount: number;
}>();

const open = ref(false);
const visits = ref<Visit[]>([]);
const loading = ref(false);

const onOpen = async (val: boolean) => {
  open.value = val;
  if (val && visits.value.length === 0) {
    loading.value = true;
    try {
      const res = await fetchLinkVisits(props.linkId);
      visits.value = res.data.data;
    } finally {
      loading.value = false;
    }
  }
};

const formatDate = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
};

const formatTime = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' });
};

const formatLocation = (v: Visit) => {
  if (v.city && v.country) return `${v.city}, ${v.country}`;
  if (v.country) return v.country;
  return '—';
};
</script>

<template>
  <Dialog :open="open" @update:open="onOpen">
    <DialogTrigger as-child>
      <button
        class="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
        :title="`${visitCount} views — click to see details`"
      >
        <Icon icon="radix-icons:eye-open" />
        {{ visitCount }}
      </button>
    </DialogTrigger>

    <DialogContent class="max-w-2xl max-h-[80vh] flex flex-col z-[100]">
      <DialogHeader>
        <DialogTitle>View history</DialogTitle>
      </DialogHeader>

      <div class="flex-1 overflow-auto">
        <div v-if="loading" class="flex justify-center py-8 text-muted-foreground text-sm">
          Loading...
        </div>

        <div v-else-if="visits.length === 0" class="flex justify-center py-8 text-muted-foreground text-sm">
          No views yet.
        </div>

        <table v-else class="w-full text-sm">
          <thead class="sticky top-0 bg-background border-b border-border">
            <tr class="text-left text-muted-foreground">
              <th class="py-2 pr-4 font-medium">#</th>
              <th class="py-2 pr-4 font-medium">Date</th>
              <th class="py-2 pr-4 font-medium">Time</th>
              <th class="py-2 pr-4 font-medium">IP</th>
              <th class="py-2 font-medium">Location</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(v, i) in visits"
              :key="i"
              class="border-b border-border/50 hover:bg-muted/30 transition-colors"
            >
              <td class="py-2 pr-4 text-muted-foreground">{{ i + 1 }}</td>
              <td class="py-2 pr-4">{{ formatDate(v.at) }}</td>
              <td class="py-2 pr-4 tabular-nums">{{ formatTime(v.at) }}</td>
              <td class="py-2 pr-4 font-mono text-xs">{{ v.ip }}</td>
              <td class="py-2">{{ formatLocation(v) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </DialogContent>
  </Dialog>
</template>
