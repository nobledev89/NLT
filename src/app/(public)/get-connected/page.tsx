import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { getPublishedPage, pageMetadata } from '@/lib/pages';
import { PageHero, EmptyState } from '@/components/site/page-hero';
import { ConnectionForm } from './connection-form';
import type { ConnectionFormFieldRow, ConnectionFormRow } from '@/types/database';

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const loaded = await getPublishedPage('get-connected');
  return loaded
    ? { ...pageMetadata(loaded.page), alternates: { canonical: '/get-connected' } }
    : { title: 'Get Connected' };
}

export default async function GetConnectedPage() {
  const [loaded, supabase] = await Promise.all([
    getPublishedPage('get-connected'),
    createClient(),
  ]);

  const { data: formsData } = await supabase
    .from('connection_forms')
    .select('*')
    .eq('enabled', true)
    .order('position');
  const forms = (formsData ?? []) as ConnectionFormRow[];

  const { data: fieldsData } = forms.length
    ? await supabase
        .from('connection_form_fields')
        .select('*')
        .in('form_id', forms.map((form) => form.id))
        .order('position')
    : { data: [] };
  const fields = (fieldsData ?? []) as ConnectionFormFieldRow[];

  return (
    <>
      <PageHero
        eyebrow="Next steps"
        title={loaded?.page.title ?? 'Get Connected'}
        subtitle={loaded?.page.seo_description ?? "New here? Tell us how we can help you take your next step."}
      />

      <section className="section">
        <div className="container">
          {forms.length === 0 ? (
            <EmptyState title="Connection forms are not available" description="Please check back shortly." />
          ) : (
            <div className="grid gap-6 lg:grid-cols-3">
              {forms.map((form) => (
                <ConnectionForm
                  key={form.id}
                  form={form}
                  fields={fields.filter((field) => field.form_id === form.id)}
                />
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
