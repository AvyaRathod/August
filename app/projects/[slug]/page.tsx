export default function ProjectPage({ params }: { params: { slug: string } }) {
  return <div>Project: {params.slug}</div>
}
