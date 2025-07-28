class BaseField {
    constructor(factory, config) {
        this.factory = factory;
        this.id = config.id;
        this.name = config.name || config.id;
        this.label = config.label || '';
        this.required = config.required || false;
        this.placeholder = config.placeholder || '';
        this.value = config.value || config.defaultValue || '';
        this.containerClass = config.containerClass || 'form-group';
        this.onChange = config.onChange || null;
        this.customValidation = config.customValidation || null;
        // Custom error messages support
        this.customErrorMessage = config.customErrorMessage || null;
        this.customErrorMessages = config.customErrorMessages || {};
        this.infoButton = config.infoButton || null;
        this.element = null;
        this.errorElement = null;
        this.container = null;
        this.infoPanel = null;
        this.infoPanelInstance = null;
    }
    // Get field-specific error message
    getFieldErrorMessage(errorType = 'required') {
        // Priority: 1. Custom message for specific error type, 2. General custom message, 3. Factory default
        if (this.customErrorMessages[errorType]) {
            return this.customErrorMessages[errorType];
        }
        if (errorType === 'required' && this.customErrorMessage) {
            return this.customErrorMessage;
        }
        // Fallback to factory defaults based on error type
        switch (errorType) {
        case 'required':
            return this.factory.getText('fieldRequired');
        case 'invalid':
        case 'email':
            return this.factory.getText('emailInvalid');
        case 'phone':
            return this.factory.getText('phoneInvalid');
        case 'url':
            return this.factory.getText('urlInvalid');
        case 'selectAtLeastOne':
            return this.factory.getText('selectAtLeastOne');
        case 'serviceRequired':
            return this.factory.getText('serviceRequired');
        case 'dateTimeRequired':
            return this.factory.getText('dateTimeRequired');
        default:
            return this.factory.getText('fieldRequired');
        }
    }
    createContainer() {
        this.container = document.createElement('div');
        this.container.className = this.containerClass;
        return this.container;
    }
    createLabel() {
        const labelContainer = document.createElement('div');
        labelContainer.className = 'label-container';
        const label = document.createElement('label');
        label.className = 'form-label';
        label.setAttribute('for', this.id);
        label.textContent = this.label;
        if (this.required) {
            label.classList.add('required');
            const requiredSpan = document.createElement('span');
            //requiredSpan.textContent = ' *';
            requiredSpan.className = 'required-indicator';
            label.appendChild(requiredSpan);
        }
        if (this.infoButton) {
            const infoBtn = document.createElement('button');
            infoBtn.className = 'info-button';
            infoBtn.type = 'button';
            infoBtn.setAttribute('aria-label', 'Plus d\'informations');
            infoBtn.innerHTML = this.factory.SVG_ICONS.INFO;
            infoBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.toggleInfoPanel();
            });
            label.appendChild(infoBtn);
            const infoPanel = this.createInfoPanel();
            if (infoPanel) {
                labelContainer.appendChild(label);
                labelContainer.appendChild(infoPanel);
                return labelContainer;
            }
        }
        labelContainer.appendChild(label);
        return labelContainer;
    }
    createQuestionLabel() {
        const labelContainer = document.createElement('div');
        labelContainer.className = 'label-container';
        const label = document.createElement('label');
        label.className = 'question-label';
        label.textContent = this.label;
        if (this.required) {
            label.classList.add('required');
        }
        if (this.infoButton) {
            const infoBtn = document.createElement('button');
            infoBtn.className = 'info-button';
            infoBtn.type = 'button';
            infoBtn.setAttribute('aria-label', 'Plus d\'informations');
            infoBtn.innerHTML = this.factory.SVG_ICONS.INFO;
            infoBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.toggleInfoPanel();
            });
            label.appendChild(infoBtn);
            const infoPanel = this.createInfoPanel();
            if (infoPanel) {
                labelContainer.appendChild(label);
                labelContainer.appendChild(infoPanel);
                return labelContainer;
            }
        }
        labelContainer.appendChild(label);
        return labelContainer;
    }
    createInfoPanel() {
        if (!this.infoButton) return null;
        this.infoPanel = document.createElement('div');
        this.infoPanel.className = 'info-panel';
        this.infoPanel.id = `${this.id}-info`;
        if (this.infoButton.title) {
            const titleEl = document.createElement('div');
            titleEl.className = 'info-title';
            titleEl.textContent = this.infoButton.title;
            this.infoPanel.appendChild(titleEl);
        }
        const contentEl = document.createElement('div');
        contentEl.innerHTML = this.infoButton.content;
        this.infoPanel.appendChild(contentEl);
        const closeButton = document.createElement('button');
        closeButton.className = 'close-info';
        closeButton.type = 'button';
        closeButton.setAttribute('aria-label', 'Fermer');
        closeButton.innerHTML = this.factory.SVG_ICONS.CLOSE;
        closeButton.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.hideInfoPanel();
        });
        this.infoPanel.appendChild(closeButton);
        return this.infoPanel;
    }
    toggleInfoPanel() {
        if (!this.infoPanel) return;
        const isCurrentlyShown = this.infoPanel.classList.contains('show');
        if (isCurrentlyShown) {
            this.hideInfoPanel();
        } else {
            this.showInfoPanel();
        }
    }
    showInfoPanel() {
        if (!this.infoPanel) return;
        this.factory.closeAllInfoPanels();
        this.infoPanel.classList.add('show');
        this.infoPanelInstance = {
            element: this.infoPanel,
            button: this.container.querySelector('.info-button'),
            close: () => this.hideInfoPanel()
        };
        this.factory.registerInfoPanel(this.infoPanelInstance);
    }
    hideInfoPanel() {
        if (this.infoPanel) {
            this.infoPanel.classList.remove('show');
            if (this.infoPanelInstance) {
                this.factory.unregisterInfoPanel(this.infoPanelInstance);
                this.infoPanelInstance = null;
            }
        }
    }
    createErrorElement() {
        this.errorElement = document.createElement('div');
        this.errorElement.className = 'error-message';
        this.errorElement.id = `error-${this.id}`;
        this.errorElement.innerHTML = `
            <div class="error-icon">!</div>
            <span class="error-text">${this.getFieldErrorMessage('required')}</span>
        `;
        return this.errorElement;
    }
    showError(message) {
        if (this.errorElement) {
            const errorText = this.errorElement.querySelector('.error-text');
            if (errorText) {
                errorText.textContent = message || this.getFieldErrorMessage('required');
            }
            this.errorElement.classList.add('show');
        }
    }
    hideError() {
        if (this.errorElement) {
            this.errorElement.classList.remove('show');
        }
    }
    validate() {
        if (this.required && !this.getValue()) {
            this.showError(this.getFieldErrorMessage('required'));
            return false;
        }
        if (this.customValidation) {
            const result = this.customValidation(this.getValue());
            if (result !== true) {
                this.showError(result);
                return false;
            }
        }
        this.hideError();
        return true;
    }
    getValue() {
        return this.value;
    }
    setValue(value) {
        this.value = value;
        if (this.element) {
            this.element.value = value;
        }
    }
    handleChange() {
        if (this.onChange) {
            this.onChange(this.getValue());
        }
        if (this.factory.onChangeCallback) {
            this.factory.onChangeCallback(this.name, this.getValue());
        }
        this.factory.formValues[this.name] = this.getValue();
    }
    show() {
        if (this.container) {
            this.container.style.display = 'block';
        }
    }
    hide() {
        if (this.container) {
            this.container.style.display = 'none';
        }
    }
    enable() {
        if (this.container) {
            const inputs = this.container.querySelectorAll('input, select, button');
            inputs.forEach(input => input.disabled = false);
        }
    }
    disable() {
        if (this.container) {
            const inputs = this.container.querySelectorAll('input, select, button');
            inputs.forEach(input => input.disabled = true);
        }
    }
    cleanup() {
        this.hideInfoPanel();
    }
    render() {
        throw new Error('render() method must be implemented by subclass');
    }
    resetToInitial() {
        this.value = this.defaultValue || '';
        this.hideError();
        if (this.element) {
            if (this.element.type === 'checkbox' || this.element.type === 'radio') {
                this.element.checked = false;
            } else {
                this.element.value = '';
            }
        }
    }
    clearVisualState() {
        this.hideError();
        this.hideInfoPanel();
    }
}

export default BaseField;

