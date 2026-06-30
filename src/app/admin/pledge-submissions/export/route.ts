import { NextResponse, type NextRequest } from 'next/server';
import { requireModule } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import type { PledgeStatus } from '@/types/database';

export const dynamic = 'force-dynamic';

const STATUSES: PledgeStatus[] = ['pending', 'confirmed', 'received', 'cancelled'];

type Row = {
  name: string;
  email: string;
  phone: string | null;
  amount: number;
  reference_number: string | null;
  status: string;
  created_at: string;
  campaign: { title: string } | null;
};

function csvCell(value: unknown): string {
  const s = value == null ? '' : String(value);
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export async function GET(request: NextRequest) {
  await requireModule('pledge_submissions');

  const statusParam = request.nextUrl.searchParams.get('status');
  const filter = STATUSES.includes(statusParam as PledgeStatus)
    ? (statusParam as PledgeStatus)
    : undefined;

  const supabase = await createClient();
  let query = supabase
    .from('pledge_submissions')
    .select('name, email, phone, amount, reference_number, status, created_at, campaign:pledge_campaigns(title)')
    .order('created_at', { ascending: false });
  if (filter) query = query.eq('status', filter);

  const { data } = await query;
  const rows = ((data ?? []) as unknown as Row[]) ?? [];

  const header = ['name', 'email', 'phone', 'amount', 'campaign', 'reference', 'status', 'created'];
  const lines = [header.join(',')];
  for (const r of rows) {
    lines.push(
      [
        csvCell(r.name),
        csvCell(r.email),
        csvCell(r.phone),
        csvCell(r.amount),
        csvCell(r.campaign?.title ?? ''),
        csvCell(r.reference_number),
        csvCell(r.status),
        csvCell(r.created_at),
      ].join(',')
    );
  }

  const csv = lines.join('\r\n');
  const stamp = new Date().toISOString().slice(0, 10);

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="pledge-submissions-${stamp}.csv"`,
    },
  });
}
