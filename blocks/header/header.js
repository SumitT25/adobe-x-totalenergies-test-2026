import { loadFragment } from '../fragment/fragment.js';

export default async function decorate(block) {
  // 1. Define the path to your da.live document
  // (You can hardcode this or pull it from metadata)
  const path = '/nav';

  // 2. Fetch the HTML "Fragment"
  // This function handles the heavy lifting of fetching the .plain.html version
  const fragment = await loadFragment(path);

  // 3. Clear the existing block content (the "placeholder" text)
  block.textContent = '';

  // 4. Inject the generated HTML into your block
  if (fragment) {
    // This moves the actual DOM elements from the fragment into your page
    const section = fragment.firstElementChild;
    block.append(section);
  }
}