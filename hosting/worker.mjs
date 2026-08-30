import assets from 'virtual:brand-review-assets';
import { respond } from './response.mjs';

// The default build is an owner-only review. Only the explicit prelaunch build
// excludes participant code and is a candidate for approved public publication.
export default { fetch(request) { return respond(request, assets); } };
