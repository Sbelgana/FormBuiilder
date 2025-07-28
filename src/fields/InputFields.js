import BaseField from "./BaseField.js";
class TextField extends BaseField {
    constructor(factory, config) {
        super(factory, config);
        this.maxLength = config.maxLength || null;
        this.minLength = config.minLength || null;
    }
    validate() {
        const value = this.getValue();
        if (this.required && !value) {
            this.showError(this.getFieldErrorMessage('required'));
            return false;
        }
        if (this.minLength && value.length < this.minLength) {
            const message = this.getFieldErrorMessage('minLength') ||
                `Minimum ${this.minLength} characters required`;
            this.showError(message);
            return false;
        }
        return super.validate();
    }
    render() {
        const container = this.createContainer();
        const labelContainer = this.createLabel();
        this.element = document.createElement('input');
        this.element.type = 'text';
        this.element.id = this.id;
        this.element.name = this.name;
        this.element.placeholder = this.placeholder;
        this.element.value = this.value;
        if (this.maxLength) {
            this.element.maxLength = this.maxLength;
        }
        const errorElement = this.createErrorElement();
        container.appendChild(labelContainer);
        container.appendChild(this.element);
        container.appendChild(errorElement);
        this.element.addEventListener('input', () => {
            this.value = this.element.value.trim();
            if (this.value) this.hideError();
            this.handleChange();
        });
        this.container = container;
        return container;
    }
}
/**
 * TextAreaField - Multiple text field with personalized error messages
 */
class TextAreaField extends BaseField {
    constructor(factory, config) {
        super(factory, config);
        this.rows = config.rows || 4;
        this.maxLength = config.maxLength || 500;
        this.showCounter = config.showCounter !== false;
        this.minHeight = config.minHeight || 120;
    }
    validate() {
        const value = this.getValue();
        if (this.required && !value) {
            this.showError(this.getFieldErrorMessage('required'));
            return false;
        }
        return super.validate();
    }
    render() {
        const container = this.createContainer();
        const label = this.createLabel();
        const textareaWrapper = document.createElement('div');
        textareaWrapper.className = 'textarea-wrapper';
        this.element = document.createElement('div');
        this.element.id = this.id;
        this.element.className = 'custom-textarea';
        this.element.setAttribute('contenteditable', 'true');
        this.element.setAttribute('data-placeholder', this.placeholder);
        this.element.style.minHeight = `${this.minHeight}px`;
        const lineHeight = 20;
        this.element.style.height = `${Math.max(this.minHeight, this.rows * lineHeight + 24)}px`;
        if (this.value) {
            this.element.textContent = this.value;
        }
        textareaWrapper.appendChild(this.element);
        if (this.showCounter) {
            this.counterElement = document.createElement('div');
            this.counterElement.className = 'char-counter';
            this.counterElement.innerHTML = `<span id="${this.id}-counter">${this.value.length}</span>/${this.maxLength}`;
            textareaWrapper.appendChild(this.counterElement);
        }
        const errorElement = this.createErrorElement();
        container.appendChild(label);
        container.appendChild(textareaWrapper);
        container.appendChild(errorElement);
        this.element.addEventListener('input', () => {
            let text = this.element.textContent || '';
            if (this.maxLength && text.length > this.maxLength) {
                text = text.substring(0, this.maxLength);
                this.element.textContent = text;
                const range = document.createRange();
                const sel = window.getSelection();
                range.selectNodeContents(this.element);
                range.collapse(false);
                sel.removeAllRanges();
                sel.addRange(range);
            }
            this.value = text.trim();
            if (this.value) this.hideError();
            if (this.showCounter) {
                const counter = container.querySelector(`#${this.id}-counter`);
                if (counter) counter.textContent = text.length;
            }
            this.handleChange();
        });
        this.element.addEventListener('focus', () => {
            if (this.element.textContent === '') {
                this.element.classList.add('focused');
            }
        });
        this.element.addEventListener('blur', () => {
            this.element.classList.remove('focused');
        });
        this.element.addEventListener('paste', (e) => {
            e.preventDefault();
            const text = (e.clipboardData || window.clipboardData)
                .getData('text/plain');
            const maxLength = this.maxLength || text.length;
            const finalText = text.substring(0, maxLength);
            document.execCommand('insertText', false, finalText);
        });
        this.container = container;
        return container;
    }
    getValue() {
        return this.element ? (this.element.textContent || '')
            .trim() : this.value;
    }
    setValue(value) {
        this.value = value;
        if (this.element) {
            this.element.textContent = value;
            if (this.showCounter && this.counterElement) {
                const counter = this.counterElement.querySelector(`#${this.id}-counter`);
                if (counter) counter.textContent = value.length;
            }
        }
    }
}
/**
 * EmailField - Email field with personalized error messages
 */
class EmailField extends TextField {
    validate() {
        const value = this.getValue();
        if (this.required && !value) {
            this.showError(this.getFieldErrorMessage('required'));
            return false;
        }
        if (value && !FormFieldFactory.ValidationUtils.isValidEmail(value)) {
            this.showError(this.getFieldErrorMessage('invalid'));
            return false;
        }
        return super.validate();
    }
    render() {
        const container = super.render();
        this.element.type = 'email';
        // REPLACE with this:
        this.element.addEventListener('input', () => {
            this.value = this.element.value.trim();
            if (this.value) {
                this.hideError(); // Only hide error, don't show it
            }
            this.handleChange();
        });
        // ADD this new blur event listener:
        this.element.addEventListener('blur', () => {
            const value = this.element.value.trim();
            if (value) {
                if (FormFieldFactory.ValidationUtils.isValidEmail(value)) {
                    this.hideError();
                } else {
                    this.showError(this.getFieldErrorMessage('invalid'));
                }
            }
            this.handleChange();
        });
        return container;
    }
}
/**
 * PhoneField - Phone field with personalized error messages
 */
class PhoneField extends TextField {
    validate() {
        const value = this.getValue();
        if (this.required && !value) {
            this.showError(this.getFieldErrorMessage('required'));
            return false;
        }
        if (value && !FormFieldFactory.ValidationUtils.isValidPhoneNumber(value)) {
            this.showError(this.getFieldErrorMessage('phone'));
            return false;
        }
        return super.validate();
    }
    render() {
        const container = super.render();
        this.element.type = 'tel';
        // REPLACE with this:
        this.element.addEventListener('input', () => {
            this.value = this.element.value.trim();
            if (this.value) {
                this.hideError(); // Only hide error, don't show it
            }
            this.handleChange();
        });
        // ADD this new blur event listener:
        this.element.addEventListener('blur', () => {
            const value = this.element.value.trim();
            if (value) {
                if (FormFieldFactory.ValidationUtils.isValidPhoneNumber(value)) {
                    this.hideError();
                } else {
                    this.showError(this.getFieldErrorMessage('phone'));
                }
            }
            this.handleChange();
        });
        return container;
    }
    getValue() {
        const value = this.element ? this.element.value.trim() : this.value;
        return FormFieldFactory.ValidationUtils.formatPhoneNumber(value);
    }
}
/**
 * UrlField - URL field with personalized error messages
 */
class UrlField extends TextField {
    validate() {
        const value = this.getValue();
        if (this.required && !value) {
            this.showError(this.getFieldErrorMessage('required'));
            return false;
        }
        if (value && !FormFieldFactory.ValidationUtils.isValidUrl(value)) {
            this.showError(this.getFieldErrorMessage('url'));
            return false;
        }
        return super.validate();
    }
    render() {
        const container = super.render();
        this.element.type = 'url';
        this.element.addEventListener('blur', () => {
            const value = this.element.value.trim();
            if (value) {
                if (FormFieldFactory.ValidationUtils.isValidUrl(value)) {
                    const normalized = FormFieldFactory.ValidationUtils.normalizeUrl(value);
                    this.element.value = normalized;
                    this.value = normalized;
                    this.hideError();
                } else {
                    this.showError(this.getFieldErrorMessage('url'));
                }
            }
            this.handleChange();
        });
        this.element.addEventListener('input', () => {
            this.value = this.element.value.trim();
            if (this.value && FormFieldFactory.ValidationUtils.isValidUrl(this.value)) {
                this.hideError();
            }
            this.handleChange();
        });
        return container;
    }
}

export { TextField, TextAreaField, EmailField, PhoneField, UrlField };
