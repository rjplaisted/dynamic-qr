<script setup lang="ts">
import { ref } from 'vue';
import { storeToRefs } from 'pinia';
import { toTypedSchema } from '@vee-validate/zod';
import { useForm } from 'vee-validate';
import * as z from 'zod';

import { AutoForm } from '@/components/ui/auto-form';
import { Button } from "@/components/ui/button";
import { Separator } from '@/components/ui/separator';
import { DependencyType } from '../ui/auto-form/interface';

import DeleteLink from './DeleteLink.vue';
import QrDesigner from './QrDesigner.vue';
import { useLinkStore, useNotifStore } from '@/stores';
import type { UpdateLinkRequest, QrOptions } from '@/interfaces';
import { isShortUrl } from '@/utils/regex';

const notifStore = useNotifStore();
const linkStore = useLinkStore();
const { link, loading } = storeToRefs(linkStore);

const defaultQrOptions: QrOptions = {
  darkColor: '#18181b',
  lightColor: '#ffffff',
  transparentBg: false,
  moduleShape: 'square',
  errorLevel: 'H',
  frameText: '',
  logo: '',
};

const editLinkSchema = z.object({
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
.partial()
.refine(data => {
  if (!!data.isPrivate && !data.password && !link.value?.hasPassword) return false;
  return true;
}, {
  message: 'Password is required',
  path: ['password']
});

const editLinkForm = useForm({
  validationSchema: toTypedSchema(editLinkSchema),
  initialValues: {
    isPrivate: !!link.value?.isPrivate
  }
});

const qrOptions = ref<Partial<QrOptions>>({
  ...defaultQrOptions,
  ...(link.value?.qrOptions ?? {}),
});

const submitAction = async (v: Omit<UpdateLinkRequest, 'plusQr' | 'qrOptions'>) => {
  const payload: UpdateLinkRequest = {
    ...v,
    plusQr: true,
    qrOptions: qrOptions.value,
  };

  const status = await linkStore.UpdateLink(payload);

  if (status === 'success') notifStore.Notify({
    status: status,
    title: 'Updating link successful!',
    message: `Your link (${link.value?._id}) has been successfully updated.`
  });
};

</script>

<template>
  <AutoForm
    class="space-y-6"
    :disabled="loading"
    :schema="editLinkSchema"
    :form="editLinkForm"
    :field-config="{
      title: {
        label: 'Title',
        description: 'This is the title that will be displayed on your link.',
        inputProps: {
          defaultValue: link?.title,
          placeholder: link?.title
        }
      },
      originUrl: {
        label: 'URL',
        description: 'Link to be targeted.',
        inputProps: {
          type: 'link',
          defaultValue: link?.originUrl,
          placeholder: link?.originUrl
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
          placeholder: link?.hasPassword ? '••••••••' : 'Password has never been set'
        }
      },
      description: {
        label: 'Description',
        description: 'Let`s describe what this short is',
        component: 'textarea',
        inputProps: {
          defaultValue: link?.description,
          placeholder: link?.description
        }
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
        when: isPrivate => (!!isPrivate && !link?.hasPassword)
      },
    ]"
    @submit="submitAction">

    <div class="space-y-4">
      <Separator />
      <QrDesigner v-model="qrOptions" :preview-url="editLinkForm.values.originUrl ?? link?.originUrl" />
    </div>

    <DeleteLink />

    <div class="flex gap-3">
      <Button type="submit" :disabled="loading">
        {{ loading ? 'Saving...' : 'Save'}}
      </Button>
    </div>

  </AutoForm>
</template>
