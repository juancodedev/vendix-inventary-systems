import { redirect } from 'next/navigation';

export default async function InventoryRootDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    redirect(`/dashboard/inventory/${id}`);
}