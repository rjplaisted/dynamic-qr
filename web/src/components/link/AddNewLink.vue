<script setup lang="ts">
import { ref } from 'vue';
import { toTypedSchema } from '@vee-validate/zod';
import { useForm } from 'vee-validate';
import * as z from 'zod';

import { AutoForm } from '@/components/ui/auto-form';
import { Button } from "@/components/ui/button";
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { DependencyType } from '../ui/auto-form/interface';

import QrDesigner from './QrDesigner.vue';
import { useLinkStore, useNotifStore } from '@/stores';
import type { LinkRequest, QrOptions } from '@/interfaces';
import { isShortUrl } from '@/utils/regex';

const notifStore = useNotifStore();
const linkStore = useLinkStore();

const defaultQrOptions: QrOptions = {
  darkColor: '#18181b',
  lightColor: '#ffffff',
  transparentBg: false,
  moduleShape: 'square',
  errorLevel: 'H',
  frameText: '',
  logo: '',
};

const newLinkSchema = z.object({
  title: z.string()
    .max(100, {message: 'Too long!'}),
  originUrl: z.string()
    .url({message: 'Invalid URL!'})
    .transform((u, ctx) => {
      try {
        const decoded = decodeURIComponent(u);
        if (isShortUrl(decoded)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Our short link cannot be used as Origin URL!'
          });
        }
      } catch (e) {
        return encodeURI(u);
      }

      return u;
    }),
  isPrivate: z.boolean(),
  password: z.string()
    .min(8, {message: 'Minimum 8 caharcters'}),
  description: z.string()
    .max(300, {message: 'Too long!'}),
})
.partial({
  isPrivate: true,
  password: true,
  description: true,
})
.refine(data => {
  if (data.isPrivate && !data.password) return false;
  return true;
}, {
  message: 'Password required',
  path: ['password']
});

const createForm = useForm({
  validationSchema: toTypedSchema(newLinkSchema)
});

const plusQr = ref(false);
const qrOptions = ref<Partial<QrOptions>>({ ...defaultQrOptions });

const submitAction = async (v: Omit<LinkRequest, 'plusQr' | 'qrOptions'>) => {
  const payload: LinkRequest = {
    ...v,
    plusQr: plusQr.value,
    qrOptions: plusQr.value ? qrOptions.value : undefined,
  };

  const status = await linkStore.CreateLink(payload);

  if (status === 'success') notifStore.Notify({
    status: status,
    title: 'Add new link successful!',
    message: `Your new link has been successfully added.`
  });
};
</script>

<template>
  <AutoForm
    class="space-y-6"
    :disabled="linkStore.loading"
    :schema="newLinkSchema"
    :form="createForm"
    :field-config="{
      title: {
        label: 'Title',
        description: 'This is the title that will be displayed on your link.',
        inputProps: {
          placeholder: 'Study Material Link'
        }
      },
      originUrl: {
        label: 'URL',
        description: 'Link to be targeted.',
        inputProps: {
          type: 'link',
          placeholder: 'https://the.link/targeted-has-to-be-here'
        }
      },
      isPrivate: {
        label: 'Want to keep it a secret?',
        description: 'Turning this on will require a password.',
        component: 'switch'
      },
      password: {
        label: 'Password',
        inputProps: {
          type: 'password',
          placeholder: '••••••••'
        }
      },
      description: {
        label: 'Description',
        description: 'Let`s describe what this short is',
        component: 'textarea'
      },
    }"
    :dependencies="[
      {
        sourceField: 'isPrivate',
        type: DependencyType.HIDES,
        targetField: 'password',
        when: isPrivate => !isPrivate
      },
      {
        sourceField: 'isPrivate',
        type: DependencyType.REQUIRES,
        targetField: 'password',
        when: isPrivate => !!isPrivate
      }
    ]"
    @submit="submitAction">

    <div class="space-y-4">
      <Separator />

      <div class="flex items-center gap-3">
        <Switch
          :checked="plusQr"
          @update:checked="plusQr = $event"
          :disabled="linkStore.loading"
        />
        <div>
          <Label class="text-sm font-medium cursor-pointer">Generate QR Code</Label>
          <p class="text-xs text-muted-foreground">This will generate a dynamic QR code linked to your short.</p>
        </div>
      </div>

      <QrDesigner v-if="plusQr" v-model="qrOptions" :preview-url="createForm.values.originUrl" />
    </div>

    <Button type="submit" :disabled="linkStore.loading">
      {{ linkStore.loading ? 'Saving...' : 'Save'}}
    </Button>

  </AutoForm>
</template>
