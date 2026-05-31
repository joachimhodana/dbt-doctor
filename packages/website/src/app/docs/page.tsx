import { DocsLayout } from "@/components/docs/docs-layout";
import { getDocsNavigation, getDocsPage } from "@/utils/docs";

const DocsIndexPage = async () => {
  const [navigation, page] = await Promise.all([getDocsNavigation(), getDocsPage([])]);

  return <DocsLayout navigation={navigation} markdown={page.markdown} currentHref={page.href} />;
};

export default DocsIndexPage;
