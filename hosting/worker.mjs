import assets from 'virtual:brand-review-assets';
import program from 'virtual:private-program';
import { respond } from './response.mjs';

// Sales builds keep the lesson data in the Worker, behind purchase validation.
// The default private-review and closed prelaunch modes remain available.
export default { fetch(request, env) { return respond(request, assets, env, program); } };
