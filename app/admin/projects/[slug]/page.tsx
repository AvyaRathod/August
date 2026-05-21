export default function AdminProjectPage({ params }: { params: { slug: string } }) {
  return <div>Admin Project: {params.slug}</div>
}
