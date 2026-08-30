import assets from 'virtual:brand-review-assets';
import { respond } from './response.mjs';

// Sites access must remain owner-only. This is a review, not a sales release.
export default { fetch(request) { return respond(request, assets); } };
