(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
    typeof define === 'function' && define.amd ? define(factory) :
    (global.flInteractiveForm = factory());
}(this, (function () { 'use strict';

if (!('remove' in Element.prototype)) {
    Element.prototype.remove = function () {
        if (this.parentNode) {
            this.parentNode.removeChild(this);
        }
    };
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}



function fakeEvent(answers) {
  return {
    detail: {
      answers: answers
    }
  };
}

function applyDataMask(field, fieldMask) {
  var mask = fieldMask.split('');

  // For now, this just strips everything that's not a number
  function stripMask(maskedData) {
    function isDigit(char) {
      return (/\d/.test(char)
      );
    }
    return maskedData.split('').filter(isDigit);
  }

  // Replace `_` characters with characters from `data`
  function applyMask(data) {
    return mask.map(function (char) {
      if (char !== ' ') return char;
      if (data.length == 0) return char;
      return data.shift();
    }).join('');
  }

  function reapplyMask(data) {
    return applyMask(stripMask(data));
  }

  function changed() {
    var oldStart = field.selectionStart;
    var oldEnd = field.selectionEnd;

    field.value = reapplyMask(field.value);

    field.selectionStart = oldStart;
    field.selectionEnd = oldEnd;
  }

  field.addEventListener('click', changed);
  field.addEventListener('keyup', changed);
}

// createErrorMessage: String -> HTML
function createErrorMessage(message) {
  var err = document.createElement('div');
  err.className = 'fl-if_Error fl-if_Error--speechBubble';
  err.innerHTML = message;
  return err;
}

function removeErrorMessage(field) {
  var errorMessages = Array.from(field.querySelectorAll('.fl-if_Error'));
  errorMessages.forEach(function (er) {
    return er.remove();
  });
}

function trimSpaces(str) {
  return str.replace(/\s+/g, ' ').replace(/^\s+/, '').replace(/\s+$/, '');
}

// ---- RADIO AND CHECKBOX INPUT
function validateDropdown(field, required) {
  var container = field.parentElement;
  removeErrorMessage(container);
  if (required && !trimSpaces(field.value)) {
    container.appendChild(createErrorMessage('Please choose an option'));
    return false;
  }
  return true;
}

function validateOptions(container, required) {
  removeErrorMessage(container);

  var oneChecked = Array.from(container.querySelectorAll('input')).map(function (r) {
    return r.checked;
  }).reduce(function (out, checked) {
    return out || checked;
  }, false);

  if (required && !oneChecked) {
    container.appendChild(createErrorMessage('Please choose an option'));
    return false;
  }
  return true;
}

function createOptionsInput(config) {
  var wrapper = document.createElement('div');

  wrapper.className = 'fl-if_OptionsInput';

  var options = [];
  var optionType = config.type === 'RadioButtons' ? 'radio' : 'checkbox';
  var optionName = config.title.replace(/\s'"/gi, '');
  for (var i = 0; i < config.options.length; i++) {
    var optionID = Date.now() + Math.random();
    var optionWrapper = document.createElement('div');
    optionWrapper.className = 'fl-if_OptionsInput-optionWrapper';

    var optionEl = document.createElement('input');
    optionEl.id = optionID;
    optionEl.type = optionType;
    optionEl.setAttribute('value', config.options[i].value || config.options[i].caption);
    optionEl.setAttribute('name', optionName);
    optionWrapper.appendChild(optionEl);

    var label = document.createElement('label');
    label.setAttribute('for', optionID);
    label.className = wrapper.className + '-option';
    label.className += config.type === 'RadioButtons' ? ' fl-if_OptionsInput-radio' : ' fl-if_OptionsInput-checkbox';
    optionWrapper.appendChild(label);

    var optionLegend = document.createTextNode(config.options[i].caption);
    label.appendChild(optionLegend);

    wrapper.appendChild(optionWrapper);
    options.push(optionEl);
  }

  wrapper.getValue = function getValue() {
    var value = [];
    for (var j = 0; j < options.length; j++) {
      if (options[j].checked) {
        value.push(config.options[j]);
      }
    }

    return value;
  };

  wrapper.validate = function () {
    return validateOptions(wrapper, config.required);
  };

  return wrapper;
}

// ---- DROPDOWN INPUT

function createDropdownInput(config) {
  var wrapper = document.createElement('div');
  wrapper.className = 'fl-if_Dropdown fl-if_OptionsInput';

  var select = document.createElement('select');
  select.className = 'fl-if_Dropdown-option';
  select.setAttribute('name', config.title);
  if (config.required) {
    select.setAttribute('required', true);
  }
  wrapper.appendChild(select);

  var optionEl = void 0;

  // default placeholder
  optionEl = document.createElement('option');
  optionEl.innerHTML = 'Please select an option';
  optionEl.setAttribute('selected', true);
  optionEl.setAttribute('disabled', true);
  select.appendChild(optionEl);

  var disabledIndexes = config.disabledIndexes || [];
  for (var optionIndex = 0; optionIndex < config.options.length; optionIndex++) {
    optionEl = document.createElement('option');

    var optionValue = config.options[optionIndex].value || config.options[optionIndex].caption;
    optionEl.setAttribute('value', optionValue);
    optionEl.innerHTML = config.options[optionIndex].caption;

    for (var j = 0; j < disabledIndexes.length; j++) {
      if (optionIndex === config.disabledIndexes[j]) {
        optionEl.setAttribute('disabled', true);
      }
    }

    select.appendChild(optionEl);
  }

  wrapper.getValue = function getValue() {
    return select.value;
  };

  wrapper.validate = function () {
    return validateDropdown(select, config.required);
  };

  select.addEventListener('blur', wrapper.validate);

  return wrapper;
}

function createCountryDropdownInput(config) {
  config.options = [{ value: 1, caption: 'AFGHANISTAN' }, { value: 2, caption: 'ALBANIA' }, { value: 3, caption: 'ALGERIA' }, { value: 4, caption: 'AMERICAN SAMOA' }, { value: 5, caption: 'ANDORRA' }, { value: 6, caption: 'ANGOLA' }, { value: 7, caption: 'ANGUILLA' }, { value: 8, caption: 'ANTARCTICA' }, { value: 9, caption: 'ANTIGUA AND BARBUDA' }, { value: 10, caption: 'ARGENTINA' }, { value: 11, caption: 'ARMENIA' }, { value: 12, caption: 'ARUBA' }, { value: 13, caption: 'AUSTRALIA' }, { value: 14, caption: 'AUSTRIA' }, { value: 15, caption: 'AZERBAIJAN' }, { value: 16, caption: 'BAHAMAS' }, { value: 17, caption: 'BAHRAIN' }, { value: 18, caption: 'BANGLADESH' }, { value: 19, caption: 'BARBADOS' }, { value: 20, caption: 'BELARUS' }, { value: 21, caption: 'BELGIUM' }, { value: 22, caption: 'BELIZE' }, { value: 23, caption: 'BENIN' }, { value: 24, caption: 'BERMUDA' }, { value: 25, caption: 'BHUTAN' }, { value: 26, caption: 'BOLIVIA' }, { value: 27, caption: 'BOSNIA AND HERZEGOWINA' }, { value: 28, caption: 'BOTSWANA' }, { value: 29, caption: 'BOUVET ISLAND' }, { value: 30, caption: 'BRAZIL' }, { value: 31, caption: 'BRITISH INDIAN OCEAN TERRITORY' }, { value: 32, caption: 'BRUNEI DARUSSALAM' }, { value: 33, caption: 'BULGARIA' }, { value: 34, caption: 'BURKINA FASO' }, { value: 35, caption: 'BURUNDI' }, { value: 36, caption: 'CAMBODIA' }, { value: 37, caption: 'CAMEROON' }, { value: 38, caption: 'CANADA' }, { value: 39, caption: 'CAPE VERDE' }, { value: 40, caption: 'CAYMAN ISLANDS' }, { value: 41, caption: 'CENTRAL AFRICAN REPUBLIC' }, { value: 42, caption: 'CHAD' }, { value: 43, caption: 'CHILE' }, { value: 44, caption: 'CHINA' }, { value: 45, caption: 'CHRISTMAS ISLAND' }, { value: 46, caption: 'COCOS (KEELING) ISLANDS' }, { value: 47, caption: 'COLOMBIA' }, { value: 48, caption: 'COMOROS' }, { value: 49, caption: 'CONGO' }, { value: 50, caption: 'CONGO, THE DRC' }, { value: 51, caption: 'COOK ISLANDS' }, { value: 52, caption: 'COSTA RICA' }, { value: 53, caption: 'COTE D\'IVOIRE' }, { value: 54, caption: 'CROATIA (local{ value: nam, caption: \'Hrvatska)' }, { value: 55, caption: 'CUBA' }, { value: 56, caption: 'CYPRUS' }, { value: 57, caption: 'CZECH REPUBLIC' }, { value: 58, caption: 'DENMARK' }, { value: 59, caption: 'DJIBOUTI' }, { value: 60, caption: 'DOMINICA' }, { value: 61, caption: 'DOMINICAN REPUBLIC' }, { value: 62, caption: 'EAST TIMOR' }, { value: 63, caption: 'ECUADOR' }, { value: 64, caption: 'EGYPT' }, { value: 65, caption: 'EL SALVADOR' }, { value: 242, caption: 'ENGLAND' }, { value: 66, caption: 'EQUATORIAL GUINEA' }, { value: 67, caption: 'ERITREA' }, { value: 68, caption: 'ESTONIA' }, { value: 69, caption: 'ETHIOPIA' }, { value: 70, caption: 'FALKLAND ISLANDS (MALVINAS)' }, { value: 71, caption: 'FAROE ISLANDS' }, { value: 72, caption: 'FIJI' }, { value: 73, caption: 'FINLAND' }, { value: 74, caption: 'FRANCE' }, { value: 75, caption: 'FRANCE, METROPOLITAN' }, { value: 76, caption: 'FRENCH GUIANA' }, { value: 77, caption: 'FRENCH POLYNESIA' }, { value: 78, caption: 'FRENCH SOUTHERN TERRITORIES' }, { value: 79, caption: 'GABON' }, { value: 246, caption: 'GALAPAGOS' }, { value: 80, caption: 'GAMBIA' }, { value: 81, caption: 'GEORGIA' }, { value: 82, caption: 'GERMANY' }, { value: 83, caption: 'GHANA' }, { value: 84, caption: 'GIBRALTAR' }, { value: 85, caption: 'GREECE' }, { value: 86, caption: 'GREENLAND' }, { value: 87, caption: 'GRENADA' }, { value: 88, caption: 'GUADELOUPE' }, { value: 89, caption: 'GUAM' }, { value: 90, caption: 'GUATEMALA' }, { value: 91, caption: 'GUINEA' }, { value: 92, caption: 'GUINEA-BISSAU' }, { value: 93, caption: 'GUYANA' }, { value: 94, caption: 'HAITI' }, { value: 245, caption: 'HAWAII' }, { value: 95, caption: 'HEARD AND MC DONALD ISLANDS' }, { value: 96, caption: 'HOLY SEE (VATICAN CITY STATE)' }, { value: 97, caption: 'HONDURAS' }, { value: 98, caption: 'HONG KONG' }, { value: 99, caption: 'HUNGARY' }, { value: 100, caption: 'ICELAND' }, { value: 101, caption: 'INDIA' }, { value: 102, caption: 'INDONESIA' }, { value: 103, caption: 'IRAN (ISLAMIC REPUBLIC OF)' }, { value: 104, caption: 'IRAQ' }, { value: 105, caption: 'IRELAND' }, { value: 106, caption: 'ISRAEL' }, { value: 107, caption: 'ITALY' }, { value: 108, caption: 'JAMAICA' }, { value: 109, caption: 'JAPAN' }, { value: 110, caption: 'JORDAN' }, { value: 111, caption: 'KAZAKHSTAN' }, { value: 112, caption: 'KENYA' }, { value: 113, caption: 'KIRIBATI' }, { value: 114, caption: 'KOREA, D.P.R.O.' }, { value: 115, caption: 'KOREA, REPUBLIC OF' }, { value: 116, caption: 'KUWAIT' }, { value: 117, caption: 'KYRGYZSTAN' }, { value: 118, caption: 'LAOS' }, { value: 119, caption: 'LATVIA' }, { value: 120, caption: 'LEBANON' }, { value: 121, caption: 'LESOTHO' }, { value: 122, caption: 'LIBERIA' }, { value: 123, caption: 'LIBYAN ARAB JAMAHIRIYA' }, { value: 124, caption: 'LIECHTENSTEIN' }, { value: 125, caption: 'LITHUANIA' }, { value: 126, caption: 'LUXEMBOURG' }, { value: 127, caption: 'MACAU' }, { value: 128, caption: 'MACEDONIA' }, { value: 129, caption: 'MADAGASCAR' }, { value: 130, caption: 'MALAWI' }, { value: 131, caption: 'MALAYSIA' }, { value: 132, caption: 'MALDIVES' }, { value: 133, caption: 'MALI' }, { value: 134, caption: 'MALTA' }, { value: 135, caption: 'MARSHALL ISLANDS' }, { value: 136, caption: 'MARTINIQUE' }, { value: 137, caption: 'MAURITANIA' }, { value: 138, caption: 'MAURITIUS' }, { value: 139, caption: 'MAYOTTE' }, { value: 140, caption: 'MEXICO' }, { value: 141, caption: 'MICRONESIA, FEDERATED STATES OF' }, { value: 142, caption: 'MOLDOVA, REPUBLIC OF' }, { value: 143, caption: 'MONACO' }, { value: 144, caption: 'MONGOLIA' }, { value: 145, caption: 'MONTENEGRO' }, { value: 146, caption: 'MONTSERRAT' }, { value: 147, caption: 'MOROCCO' }, { value: 148, caption: 'MOZAMBIQUE' }, { value: 244, caption: 'MULTI COUNTRY' }, { value: 149, caption: 'MYANMAR (Burma)' }, { value: 150, caption: 'NAMIBIA' }, { value: 151, caption: 'NAURU' }, { value: 152, caption: 'NEPAL' }, { value: 153, caption: 'NETHERLANDS' }, { value: 154, caption: 'NETHERLANDS ANTILLES' }, { value: 155, caption: 'NEW CALEDONIA' }, { value: 156, caption: 'NEW ZEALAND' }, { value: 157, caption: 'NICARAGUA' }, { value: 158, caption: 'NIGER' }, { value: 159, caption: 'NIGERIA' }, { value: 160, caption: 'NIUE' }, { value: 161, caption: 'NORFOLK ISLAND' }, { value: 162, caption: 'NORTHERN MARIANA ISLANDS' }, { value: 163, caption: 'NORWAY' }, { value: 164, caption: 'OMAN' }, { value: 165, caption: 'PAKISTAN' }, { value: 166, caption: 'PALAU' }, { value: 167, caption: 'PANAMA' }, { value: 168, caption: 'PAPUA NEW GUINEA' }, { value: 169, caption: 'PARAGUAY' }, { value: 170, caption: 'PERU' }, { value: 171, caption: 'PHILIPPINES' }, { value: 172, caption: 'PITCAIRN' }, { value: 173, caption: 'POLAND' }, { value: 174, caption: 'PORTUGAL' }, { value: 175, caption: 'PUERTO RICO' }, { value: 176, caption: 'QATAR' }, { value: 177, caption: 'REUNION' }, { value: 178, caption: 'ROMANIA' }, { value: 179, caption: 'RUSSIAN FEDERATION' }, { value: 180, caption: 'RWANDA' }, { value: 181, caption: 'SAINT KITTS AND NEVIS' }, { value: 182, caption: 'SAINT LUCIA' }, { value: 183, caption: 'SAINT VINCENT AND THE GRENADINES' }, { value: 184, caption: 'SAMOA' }, { value: 185, caption: 'SAN MARINO' }, { value: 186, caption: 'SAO TOME AND PRINCIPE' }, { value: 187, caption: 'SAUDI ARABIA' }, { value: 243, caption: 'SCOTLAND' }, { value: 188, caption: 'SENEGAL' }, { value: 189, caption: 'SERBIA' }, { value: 190, caption: 'SEYCHELLES' }, { value: 191, caption: 'SIERRA LEONE' }, { value: 192, caption: 'SINGAPORE' }, { value: 193, caption: 'SLOVAKIA (Slovak Republic)' }, { value: 194, caption: 'SLOVENIA' }, { value: 195, caption: 'SOLOMON ISLANDS' }, { value: 196, caption: 'SOMALIA' }, { value: 197, caption: 'SOUTH AFRICA' }, { value: 198, caption: 'SOUTH GEORGIA AND SOUTH S.S.' }, { value: 199, caption: 'SOUTH SUDAN' }, { value: 200, caption: 'SPAIN' }, { value: 201, caption: 'SRI LANKA' }, { value: 202, caption: 'ST. HELENA' }, { value: 203, caption: 'ST. PIERRE AND MIQUELON' }, { value: 204, caption: 'SUDAN' }, { value: 205, caption: 'SURINAME' }, { value: 206, caption: 'SVALBARD AND JAN MAYEN ISLANDS' }, { value: 207, caption: 'SWAZILAND' }, { value: 208, caption: 'SWEDEN' }, { value: 209, caption: 'SWITZERLAND' }, { value: 210, caption: 'SYRIAN ARAB REPUBLIC' }, { value: 211, caption: 'TAIWAN, PROVINCE OF CHINA' }, { value: 212, caption: 'TAJIKISTAN' }, { value: 213, caption: 'TANZANIA, UNITED REPUBLIC OF' }, { value: 214, caption: 'THAILAND' }, { value: 215, caption: 'TOGO' }, { value: 216, caption: 'TOKELAU' }, { value: 217, caption: 'TONGA' }, { value: 218, caption: 'TRINIDAD AND TOBAGO' }, { value: 219, caption: 'TUNISIA' }, { value: 220, caption: 'TURKEY' }, { value: 221, caption: 'TURKMENISTAN' }, { value: 222, caption: 'TURKS AND CAICOS ISLANDS' }, { value: 223, caption: 'TUVALU' }, { value: 224, caption: 'U.S. MINOR ISLANDS' }, { value: 225, caption: 'UGANDA' }, { value: 226, caption: 'UKRAINE' }, { value: 227, caption: 'UNITED ARAB EMIRATES' }, { value: 228, caption: 'UNITED KINGDOM' }, { value: 229, caption: 'UNITED STATES' }, { value: 230, caption: 'URUGUAY' }, { value: 231, caption: 'UZBEKISTAN' }, { value: 232, caption: 'VANUATU' }, { value: 233, caption: 'VENEZUELA' }, { value: 234, caption: 'VIETNAM' }, { value: 235, caption: 'VIRGIN ISLANDS (BRITISH)' }, { value: 236, caption: 'VIRGIN ISLANDS (U.S.)' }, { value: 237, caption: 'WALLIS AND FUTUNA ISLANDS' }, { value: 238, caption: 'WESTERN SAHARA' }, { value: 239, caption: 'YEMEN' }, { value: 240, caption: 'ZAMBIA' }, { value: 241, caption: 'ZIMBABWE' }];
  return createDropdownInput(config);
}

var textInputTypes = {
  TextArea: {
    type: 'text',
    regex: /\w{2,}/,
    error: 'This field must be filled'
  },
  TextBox: {
    type: 'text',
    regex: /\w{2,}/,
    error: 'This field must be filled'
  },
  EmailBox: {
    type: 'email',
    // Simple and quite broad for basic validation.
    regex: /^(.+)@(.+){2,}\.(.+){2,}$/,
    error: 'Please insert a valid email address'
  },
  NumberBox: {
    type: 'number',
    regex: /^[0-9]+$/,
    error: 'Please insert a valid number'
  },
  TelephoneBox: {
    type: 'tel',
    // matches (+23) 2343 - 2342
    regex: /^[\+0-9\-\(\)\s]{6,}$/,
    error: 'Please insert a valid telephone number'
  }
};

// Returns true if valid and false if not.
// HTML -> Boolean
function validate(field, required, type) {
  // Remove errors
  removeErrorMessage(field.parentElement);
  var regex = textInputTypes[type].regex;
  var content = trimSpaces(field.value);

  if (!required || !regex || regex.test(content)) {
    return true;
  }
  field.parentElement.appendChild(createErrorMessage(textInputTypes[type].error));
  return false;
}

function createTextInput(config) {
  var tagName = config.type === 'TextArea' ? 'textarea' : 'input';
  var el = document.createElement(tagName);
  el.className = tagName === 'textarea' ? 'fl-if_TextInput-input fl-if_TextAreaInput-input' : 'fl-if_TextInput-input';
  el.setAttribute('name', config.title);
  el.setAttribute('type', textInputTypes[config.type].type);
  el.placeholder = config.placeholder;
  if (config.required) {
    el.setAttribute('required', true);
  }

  el.getValue = function getValue() {
    return el.value;
  };

  el.validate = function () {
    return validate(el, config.required, config.type);
  };

  el.addEventListener('blur', el.validate);

  return el;
}

function validate$1(field, required) {
  var dateNumbers = trimSpaces(field.value).match(/[0-9]/g) || [];
  var container = field.parentElement;
  removeErrorMessage(container);

  if (required && dateNumbers.length !== 8) {
    createErrorMessage(container);
    return false;
  }
  return true;
}

function createDateInput(config) {
  // eslint-disable-line no-unused-vars
  var dateField = document.createElement('input');
  dateField.setAttribute('type', 'text');
  dateField.className = 'fl-if_TextInput-input';
  dateField.value = 'DD/MM/YYYY';
  if (config.required) {
    dateField.setAttribute('required', true);
  }
  applyDataMask(dateField, '  /  /    ');

  dateField.getValue = function () {
    return dateField.value;
  };

  dateField.validate = function () {
    return validate$1(dateField, config.required);
  };

  return dateField;
}

// ================= FIELD FACTORY ===================//
//
//  Implements the `getValue` method to return the input value
//

var inputCreators = {
  EmailBox: createTextInput,
  NumberBox: createTextInput,
  TelephoneBox: createTextInput,
  TextBox: createTextInput,
  TextArea: createTextInput,
  Checkboxes: createOptionsInput,
  Dropdown: createDropdownInput,
  CountryDropdown: createCountryDropdownInput,
  RadioButtons: createOptionsInput,
  DateField: createDateInput
};

/**
 * @method formField
 * @param  {Object} config Question configuration object
 * @return {HTMLElement}
 */
function formField(config) {
  var wrapper = document.createElement('div');
  wrapper.className = 'fl-if_FormField fl-if_FormField--active';

  var legend = document.createElement('p');
  legend.className = 'fl-if_FormField-legend';
  legend.innerHTML = config.title;

  var elementType = inputCreators[config.type] || inputCreators[config.primitiveType];
  var inputEl = elementType(config);

  wrapper.appendChild(legend);
  wrapper.appendChild(inputEl);
  wrapper.getValue = inputEl.getValue;
  wrapper.validate = inputEl.validate;
  return wrapper;
}

// =============== FORM STRUCTURE ===================//

function es3Form(config) {
  var form = document.createElement('form');
  form.className = 'fl-if_FormUI fl-if_FormUI-es3';

  var questions = [];
  var questionEl = void 0;
  for (var i = 0; i < config.length; i++) {
    questionEl = formField(config[i]);
    questions.push(questionEl);
    form.appendChild(questionEl);
  }

  var submitBtnContainer = document.createElement('div');
  submitBtnContainer.className = 'fl-if_FormField fl-if_FormField--active';

  var submitBtn = document.createElement('button');
  submitBtn.setAttribute('type', 'submit');
  submitBtn.innerHTML = 'Submit';
  submitBtn.className = 'fl-if_NavigationBar-button';
  submitBtnContainer.appendChild(submitBtn);
  form.appendChild(submitBtnContainer);

  var formWrapper = document.createElement('div');
  formWrapper.className = 'fl-if';
  formWrapper.appendChild(form);

  var listeners = [];
  formWrapper.addEventListener = function customAddEventListener(event, callback) {
    if (event === 'submit') {
      listeners.push(callback);
    } else {
      return form.addEventListener(event, callback);
    }
    return null;
  };

  formWrapper.triggerSubmit = function triggerSubmit(formData) {
    var evt = fakeEvent(formData);
    for (var j = 0; j < listeners.length; j++) {
      listeners[j](evt);
    }
  };

  form.addEventListener('submit', function submitBtnClick(e) {
    e.preventDefault();
    e.stopPropagation();
    removeErrorMessage(submitBtnContainer);
    var notValidatedFields = questions.map(function (field) {
      if (field.validate) {
        return field.validate();
      }
      return true;
    }).filter(function (v) {
      return !v;
    });

    if (notValidatedFields.length > 0) {
      submitBtnContainer.appendChild(createErrorMessage(notValidatedFields.length + ' fields need to be completed.'));
      return false;
    }

    var formData = config.map(function (field, index) {
      return Object.assign({}, field, { answer: questions[index].getValue() });
    });

    formWrapper.triggerSubmit(formData);

    e.preventDefault();
    e.stopPropagation();
    return false;
  });

  return formWrapper;
}

// =============== GLOBAL OBJECT ===================//

// START HERE
var flInteractiveForm = {
  create: function create(config) {
    assert(config && config.length !== undefined, 'The first argument must be a configuration array');

    var form = es3Form(config);
    return form;
  }
};

return flInteractiveForm;

})));
//# sourceMappingURL=fl-interactive-form-es3.js.map
