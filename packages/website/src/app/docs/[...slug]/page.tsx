import { DocsLayout } from "@/components/docs/docs-layout";
import { getAllDocsSlugs, getDocsNavigation, getDocsPage } from "@/utils/docs";

interface DocsSubpageProps {
  params: Promise<{ slug: string[] }>;
}

export const generateStaticParams = async () => {
  const slugs = await getAllDocsSlugs();
  return slugs.map((slug) => ({ slug }));
};

const DocsSubpage = async ({ params }: DocsSubpageProps) => {
  const { slug } = await params;

  const [navigation, page] = await Promise.all([getDocsNavigation(), getDocsPage(slug)]);

  return <DocsLayout navigation={navigation} markdown={page.markdown} currentHref={page.href} />;
};

export default DocsSubpage;
