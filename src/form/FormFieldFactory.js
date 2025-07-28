import { MultiStepForm } from './MultiStepForm.js';
import { TextField, TextAreaField, EmailField, PhoneField, UrlField } from '../fields/InputFields.js';

class FormFieldFactory {
  constructor(options = {}) {
    this.container = options.container || document.body;
    this.formValues = options.formValues || {};
    this.onChangeCallback = options.onChange || null;
    this.texts = options.texts || {};
  }
  getText(key) {
    return this.texts[key] || key;
  }
  createTextField(config) { return new TextField(this, config); }
  createTextAreaField(config) { return new TextAreaField(this, config); }
  createEmailField(config) { return new EmailField(this, config); }
  createPhoneField(config) { return new PhoneField(this, config); }
  createUrlField(config) { return new UrlField(this, config); }
  createMultiStepForm(config) { return new MultiStepForm(this, config); }
}
export default FormFieldFactory;
