<script setup lang="ts">
import { ref, watch, onBeforeUnmount } from 'vue';
import { toTypedSchema } from '@vee-validate/zod';
import { useForm } from 'vee-validate';
import { useDebounceFn } from '@vueuse/core';
import * as z from 'zod';

import { AutoForm } from '@/components/ui/auto-form';
import { Button } from "@/components/ui/button";
import { Separator } from '@/components/ui/separator';
import { DependencyType } from '../ui/auto-form/interface';

import QrDesigner from './QrDesigner.vue';
import { useLinkStore, useNotifStore } from '@/stores';
import { createLink as apiCreateLink, updateLink as apiUpdateLink, deleteLink as apiDeleteLink } from '@/api';
import type { LinkRequest, QrOptions } from '@/interfaces';
import { isShortUrl } from '@/utils/regex';
import { codeToStatus } from '@/utils/converter';

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

const qrOptions = ref<Partial<QrOptions>>({ ...defaultQrOptions });
const autoSavedId = ref<string | null>(null);
const previewShortUrl = ref<string>('');
let submitted = false;

const tryAutoSave = useDebounceFn(async () => {
  if (autoSavedId.value) return;
  const title = createForm.values.title;
  const originUrl = createForm.values.originUrl;
  if (!title || !originUrl) return;
  try { new URL(originUrl); } catch { return; }
  try {
    const res = await apiCreateLink({ title, originUrl, plusQr: false });
    autoSavedId.value = res.data.data._id;
    previewShortUrl.value = res.data.data.shortUrl;
  } catch {
    // silent — auto-save is best-effort, normal save still works
  }
}, 800);

watch(() => [createForm.values.title, createForm.values.originUrl], tryAutoSave);

onBeforeUnmount(() => {
  if (autoSavedId.value && !submitted) {
    apiDeleteLink(autoSavedId.value).catch(() => {});
  }
});

const submitAction = async (v: Omit<LinkRequest, 'plusQr' | 'qrOptions'>) => {
  submitted = true;
  let status: string | undefined;

  if (autoSavedId.value) {
    // Update the auto-saved link instead of creating a duplicate
    const res = await apiUpdateLink(autoSavedId.value, {
      ...v,
      plusQr: true,
      qrOptions: qrOptions.value,
    });
    status = codeToStatus(res.status);
    await linkStore.GetLinks();
  } else {
    status = await linkStore.CreateLink({ ...v, plusQr: true, qrOptions: qrOptions.value });
  }

  if (status === 'success') notifStore.Notify({
    status: 'success',
    title: 'Link saved!',
    message: 'Your new link has been successfully added.'
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
      <QrDesigner v-model="qrOptions" :preview-url="previewShortUrl" />
    </div>

    <Button type="submit" :disabled="linkStore.loading">
      {{ linkStore.loading ? 'Saving...' : 'Save'}}
    </Button>

  </AutoForm>
</template>
