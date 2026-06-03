<script setup lang="ts">
import { computed, ref } from 'vue';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import type { QrOptions } from '@/interfaces';
import { generateQrSvg, svgToDataUrl } from '@/utils/qrgen';

const props = defineProps<{
  modelValue: Partial<QrOptions>
  previewUrl?: string
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: Partial<QrOptions>): void
}>();

const defaultQrOptions: QrOptions = {
  darkColor: '#18181b',
  lightColor: '#ffffff',
  transparentBg: false,
  moduleShape: 'square',
  errorLevel: 'H',
  frameText: '',
  logo: '',
};

const model = computed<QrOptions>({
  get() {
    return { ...defaultQrOptions, ...props.modelValue };
  },
  set(val) {
    emit('update:modelValue', val);
  }
});

const update = (patch: Partial<QrOptions>) => {
  emit('update:modelValue', { ...defaultQrOptions, ...props.modelValue, ...patch });
};

const logoInputRef = ref<HTMLInputElement | null>(null);

const onLogoFileChange = (e: Event) => {
  const file = (e.target as HTMLInputElement).files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    update({ logo: reader.result as string });
  };
  reader.readAsDataURL(file);
};

const clearLogo = () => {
  update({ logo: '' });
  if (logoInputRef.value) logoInputRef.value.value = '';
};

const previewSrc = computed(() => {
  try {
    const url = props.previewUrl?.trim() || 'https://example.com';
    return svgToDataUrl(generateQrSvg(url, model.value));
  } catch {
    return '';
  }
});

const errorLevelDescriptions: Record<string, string> = {
  L: 'Low — up to 7% damage recovery',
  M: 'Medium — up to 15% damage recovery',
  Q: 'Quartile — up to 25% damage recovery',
  H: 'High — up to 30% damage recovery',
};
</script>

<template>
  <div class="space-y-5 rounded-md border border-border p-4 bg-muted/30">

    <!-- Live Preview -->
    <div class="flex flex-col items-center gap-2">
      <Label class="text-sm font-medium text-muted-foreground">Preview</Label>
      <div
        class="rounded-lg border border-border p-3 flex items-center justify-center"
        :style="{ background: model.transparentBg ? 'repeating-conic-gradient(#e4e4e7 0% 25%, transparent 0% 50%) 0 0 / 12px 12px' : model.lightColor }"
      >
        <img v-if="previewSrc" :src="previewSrc" alt="QR preview" class="w-40 h-auto" />
      </div>
      <p class="text-xs text-muted-foreground">Live preview using a placeholder URL</p>
    </div>

    <!-- Colors Row -->
    <div class="grid grid-cols-2 gap-4">
      <div class="space-y-1.5">
        <Label class="text-sm font-medium">Dark color</Label>
        <div class="flex items-center gap-2">
          <input
            type="color"
            :value="model.darkColor"
            @input="update({ darkColor: ($event.target as HTMLInputElement).value })"
            class="h-9 w-9 cursor-pointer rounded-md border border-input bg-transparent p-0.5 shadow-sm"
          />
          <Input
            :model-value="model.darkColor"
            @update:model-value="update({ darkColor: String($event) })"
            class="font-mono text-xs"
            placeholder="#18181b"
          />
        </div>
      </div>

      <div class="space-y-1.5">
        <Label class="text-sm font-medium">Background color</Label>
        <div class="flex items-center gap-2">
          <input
            type="color"
            :value="model.lightColor"
            :disabled="model.transparentBg"
            @input="update({ lightColor: ($event.target as HTMLInputElement).value })"
            class="h-9 w-9 cursor-pointer rounded-md border border-input bg-transparent p-0.5 shadow-sm disabled:cursor-not-allowed disabled:opacity-50"
          />
          <Input
            :model-value="model.lightColor"
            :disabled="model.transparentBg"
            @update:model-value="update({ lightColor: String($event) })"
            class="font-mono text-xs"
            placeholder="#ffffff"
          />
        </div>
      </div>
    </div>

    <!-- Transparent Background -->
    <div class="flex items-center gap-3">
      <Switch
        :checked="model.transparentBg"
        @update:checked="update({ transparentBg: $event })"
      />
      <Label class="text-sm cursor-pointer">Transparent background</Label>
    </div>

    <!-- Module Shape -->
    <div class="space-y-2">
      <Label class="text-sm font-medium">Module shape</Label>
      <div class="grid grid-cols-3 gap-2">
        <button
          v-for="shape in (['square', 'dot', 'rounded'] as const)"
          :key="shape"
          type="button"
          @click="update({ moduleShape: shape })"
          :class="[
            'flex flex-col items-center gap-1.5 rounded-md border p-3 text-xs font-medium transition-colors',
            model.moduleShape === shape
              ? 'border-primary bg-primary/10 text-primary'
              : 'border-border bg-background text-muted-foreground hover:border-muted-foreground'
          ]"
        >
          <!-- Square preview -->
          <svg v-if="shape === 'square'" width="28" height="28" viewBox="0 0 28 28" fill="none">
            <rect x="1" y="1" width="7" height="7" :fill="model.moduleShape === 'square' ? 'currentColor' : '#71717a'"/>
            <rect x="10" y="1" width="7" height="7" :fill="model.moduleShape === 'square' ? 'currentColor' : '#71717a'"/>
            <rect x="20" y="1" width="7" height="7" :fill="model.moduleShape === 'square' ? 'currentColor' : '#71717a'"/>
            <rect x="1" y="10" width="7" height="7" :fill="model.moduleShape === 'square' ? 'currentColor' : '#71717a'"/>
            <rect x="20" y="10" width="7" height="7" :fill="model.moduleShape === 'square' ? 'currentColor' : '#71717a'"/>
            <rect x="1" y="20" width="7" height="7" :fill="model.moduleShape === 'square' ? 'currentColor' : '#71717a'"/>
            <rect x="10" y="20" width="7" height="7" :fill="model.moduleShape === 'square' ? 'currentColor' : '#71717a'"/>
            <rect x="20" y="20" width="7" height="7" :fill="model.moduleShape === 'square' ? 'currentColor' : '#71717a'"/>
          </svg>
          <!-- Dot preview -->
          <svg v-else-if="shape === 'dot'" width="28" height="28" viewBox="0 0 28 28" fill="none">
            <circle cx="4.5" cy="4.5" r="3.5" :fill="model.moduleShape === 'dot' ? 'currentColor' : '#71717a'"/>
            <circle cx="14" cy="4.5" r="3.5" :fill="model.moduleShape === 'dot' ? 'currentColor' : '#71717a'"/>
            <circle cx="23.5" cy="4.5" r="3.5" :fill="model.moduleShape === 'dot' ? 'currentColor' : '#71717a'"/>
            <circle cx="4.5" cy="14" r="3.5" :fill="model.moduleShape === 'dot' ? 'currentColor' : '#71717a'"/>
            <circle cx="23.5" cy="14" r="3.5" :fill="model.moduleShape === 'dot' ? 'currentColor' : '#71717a'"/>
            <circle cx="4.5" cy="23.5" r="3.5" :fill="model.moduleShape === 'dot' ? 'currentColor' : '#71717a'"/>
            <circle cx="14" cy="23.5" r="3.5" :fill="model.moduleShape === 'dot' ? 'currentColor' : '#71717a'"/>
            <circle cx="23.5" cy="23.5" r="3.5" :fill="model.moduleShape === 'dot' ? 'currentColor' : '#71717a'"/>
          </svg>
          <!-- Rounded preview -->
          <svg v-else width="28" height="28" viewBox="0 0 28 28" fill="none">
            <rect x="1" y="1" width="7" height="7" rx="2" :fill="model.moduleShape === 'rounded' ? 'currentColor' : '#71717a'"/>
            <rect x="10" y="1" width="7" height="7" rx="2" :fill="model.moduleShape === 'rounded' ? 'currentColor' : '#71717a'"/>
            <rect x="20" y="1" width="7" height="7" rx="2" :fill="model.moduleShape === 'rounded' ? 'currentColor' : '#71717a'"/>
            <rect x="1" y="10" width="7" height="7" rx="2" :fill="model.moduleShape === 'rounded' ? 'currentColor' : '#71717a'"/>
            <rect x="20" y="10" width="7" height="7" rx="2" :fill="model.moduleShape === 'rounded' ? 'currentColor' : '#71717a'"/>
            <rect x="1" y="20" width="7" height="7" rx="2" :fill="model.moduleShape === 'rounded' ? 'currentColor' : '#71717a'"/>
            <rect x="10" y="20" width="7" height="7" rx="2" :fill="model.moduleShape === 'rounded' ? 'currentColor' : '#71717a'"/>
            <rect x="20" y="20" width="7" height="7" rx="2" :fill="model.moduleShape === 'rounded' ? 'currentColor' : '#71717a'"/>
          </svg>
          <span class="capitalize">{{ shape }}</span>
        </button>
      </div>
    </div>

    <!-- Error Correction Level -->
    <div class="space-y-2">
      <Label class="text-sm font-medium">Error correction level</Label>
      <div class="flex gap-2">
        <button
          v-for="level in (['L', 'M', 'Q', 'H'] as const)"
          :key="level"
          type="button"
          @click="update({ errorLevel: level })"
          :class="[
            'flex-1 rounded-md border py-1.5 text-sm font-semibold transition-colors',
            model.errorLevel === level
              ? 'border-primary bg-primary text-primary-foreground'
              : 'border-border bg-background text-muted-foreground hover:border-muted-foreground'
          ]"
        >
          {{ level }}
        </button>
      </div>
      <p class="text-xs text-muted-foreground">
        {{ errorLevelDescriptions[model.errorLevel ?? 'H'] }}
      </p>
    </div>

    <!-- Frame Text -->
    <div class="space-y-1.5">
      <Label class="text-sm font-medium">Frame / CTA text</Label>
      <Input
        :model-value="model.frameText ?? ''"
        @update:model-value="update({ frameText: String($event) })"
        placeholder="e.g. Scan Me!"
        maxlength="40"
      />
      <p class="text-xs text-muted-foreground">Optional text shown below the QR code in a colored banner.</p>
    </div>

    <!-- Logo Upload -->
    <div class="space-y-2">
      <Label class="text-sm font-medium">Logo / watermark</Label>
      <div class="flex items-start gap-3">
        <div
          v-if="model.logo"
          class="relative flex-shrink-0"
        >
          <img :src="model.logo" alt="logo preview" class="h-12 w-12 rounded-md border border-border object-contain bg-muted" />
          <button
            type="button"
            @click="clearLogo"
            class="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-destructive-foreground text-xs leading-none"
            aria-label="Remove logo"
          >
            ×
          </button>
        </div>
        <div class="flex-1 space-y-1">
          <input
            ref="logoInputRef"
            type="file"
            accept="image/*"
            @change="onLogoFileChange"
            class="block w-full text-sm text-muted-foreground file:mr-3 file:cursor-pointer file:rounded-md file:border file:border-input file:bg-background file:px-3 file:py-1 file:text-sm file:font-medium hover:file:bg-muted"
          />
          <p class="text-xs text-muted-foreground">Stored as base64. Centered over the QR code (use error level H for best results).</p>
        </div>
      </div>
    </div>

  </div>
</template>
