import './polyfills';
import es3Form from './form-creator';
import { assert } from './utils';

// =============== GLOBAL OBJECT ===================//

// START HERE
const flInteractiveForm = {
  create: function create(config, customFields) {
    assert(config && config.length !== undefined,
      'The first argument must be a configuration array');

    return es3Form(config, customFields);
  },
};

export default flInteractiveForm;
