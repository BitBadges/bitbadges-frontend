import CollectionPage from "../../../pages/collections/[collectionId]";

export function PreviewCollectionStepItem() {
  return {
    title: 'Collection Preview',
    description: `Please confirm all collection details are correct. Below is a preview of what the collection page will look like.`,
    node: () => <div>
      <CollectionPage collectionPreview />
    </div>
  }
}