# Interactive Form

Generates a nice looking form that can be navigated using keyboard keys. Open Source, **inspired by Typeform**.

[**Try it online.**](https://fourlabsldn.github.io/fl-interactive-form/examples/all_field_types/index.html)

![usage demo](https://fourlabsldn.github.io/fl-interactive-form/examples/usage-demo.gif)

## Quickstart

  To create a form just call `flInteractiveForm.create` with the configuration
  object from `form-builder` and a target element to create the form.

  You will need in your page:
    - react` and `react-dom`
    - `font-awesome.css`

``` html
  <!-- DEPENDENCIES -->
  <script src='//cdnjs.cloudflare.com/ajax/libs/react/15.3.2/react.min.js'></script>
  <script src='//cdnjs.cloudflare.com/ajax/libs/react/15.3.2/react-dom.min.js'></script>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.css">

  <!-- MODULE -->
  <link rel="stylesheet" href="../../dist/fl-interactive-form.css">
  <!--[if lte IE 9]>
  <script src="../../dist/fl-interactive-form-es3.js"></script>
  <![endif]-->
  <!--[if !lte IE 9]> -->
    <script src="../../dist/fl-interactive-form.js"></script>
  <!-- <![endif]-->

  <!-- OUR FORM CONTAINER -->
  <div id="form-container" style="height: 100vh"></div>

  <!-- BUILD THE FORM-->
  <script>
    var config = [{ question: 'What is your name?', placeholder: 'My name is...', type: 'Text', }];
    var form = flInteractiveForm.create(config);

    // We must take care of submission ourselves
    form.addEventListener('submit', function logSubmission(e) {
      var answers = e.detail.answers;
      console.log('Answer:', answers);
    });

    var targetElement = document.querySelector('#form-container');
    targetElement.appendChild(form);
  </script>
```

## Configuration

The configuration is a JSON object as generated by the [fl-form-builder](https://github.com/fourlabsldn/fl-form-builder), a native JS form builder inspired by Google Forms. [Try it here](https://fourlabsldn.github.io/fl-form-builder/demo/), you can use the JSON logged in the console when you hit save.


## Custom Types

With `fl-form-builder` you can create custom form types that look whatever way you want, but `fl-interactive-form` needs loads of bells and whistles attached to the components for the UI to work propperly. Therefore, for your custom types to work here they must be derived from one of the standard form input types. Basically, that is going to allow you to perform an initialisation task for every component and return a personalised config object.


Being derived from another component just means that the configuration object has the key `primitiveType` with the name of one of the standard types (`Dropdown`, `RadioButtons`, `TextBox`, etc) as its value.


`fl-interactive-form` calls the `initialState` function for every custom component field sending the provided configuration object as a parameter and using the returned value as the effective configuration for the field.


To be a valid derived type, the output of your `initialState` function must conform to its corresponding form field type signature. Here are the required fields in the two possible signatures:

#### text


This includes `TextBox`, `TextArea`, `EmailBox`, `TelephoneBox` and `NumberBox`.


``` javascript
{
  "type": "TextBox",
  "required": false,
  "title": "Answer a text question",
  "placeholder": "Here lies a placeholder that should be shown"
}
```

### options


This includes `Checkboxes`, `Dropdown` and `RadioButtons`.


``` javascript
{
 "required": true,
 "title": "Would you like to choose a dropdown option? (Not optional)",
 "type": "Dropdown",
 "options": [
   { value: 0, caption: "Option number one" },
   { value: 1, caption: "Option number two" },
 ],
}
```

### Including custom types

Just get your `fl-form-builder` custom type objects, gather them in an array and give it to the interactive form creator function.

``` javascript
var customComponents = [ YearSelector, TimeSlots ]

var form = flInteractiveForm.create(config, customComponents);
```
