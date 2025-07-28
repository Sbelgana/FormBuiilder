class MultiStepForm {
    constructor(factory, config) {
        this.factory = factory;
        this.config = config;
        this.steps = config.steps || [];
        this.currentStep = 0;
        this.formData = config.initialData || {};
        this.onSubmit = config.onSubmit || null;
        this.onStepChange = config.onStepChange || null;
        this.validateOnNext = config.validateOnNext !== false;
        this.showProgress = config.showProgress !== false;
        this.saveProgressEnabled = config.saveProgress !== false;
        this.storageKey = config.storageKey || 'multistep_form_data';
        this.container = null;
        this.stepInstances = [];
        this.progressBar = null;
        this.navigationButtons = null;
        this.init();
    }
    init() {
        this.factory.currentMultiStepForm = this;
        this.createContainer();
        this.createProgressBar();
        this.createSteps();
        this.createNavigation();
        this.loadSavedProgress();
        this.showCurrentStep();
    }
    createContainer() {
        this.container = document.createElement('div');
        this.container.className = 'multistep-form';
        this.factory.container.appendChild(this.container);
    }
    createProgressBar() {
        if (!this.showProgress) return;
        this.progressBar = new ProgressBar(this, {
            totalSteps: this.steps.length,
            currentStep: this.currentStep
        });
        this.container.appendChild(this.progressBar.render());
    }
    createSteps() {
        this.steps.forEach((stepConfig, index) => {
            const step = new FormStep(this, {
                ...stepConfig,
                index: index,
                isActive: index === this.currentStep
            });
            this.stepInstances.push(step);
            this.container.appendChild(step.render());
        });
    }
    createNavigation() {
        this.navigationButtons = new NavigationButtons(this);
        this.container.appendChild(this.navigationButtons.render());
    }
    showCurrentStep() {
        this.stepInstances.forEach((step, index) => {
            step.setActive(index === this.currentStep);
        });
        if (this.progressBar) {
            this.progressBar.updateProgress(this.currentStep);
        }
        this.navigationButtons.updateButtons(this.currentStep, this.steps.length);
        if (this.onStepChange) {
            this.onStepChange(this.currentStep, this.stepInstances[this.currentStep]);
        }
    }
    nextStep() {
        if (this.validateOnNext && !this.validateCurrentStep()) {
            return false;
        }
        if (this.currentStep < this.steps.length - 1) {
            this.currentStep++;
            this.showCurrentStep();
            this.saveProgress();
            return true;
        }
        return false;
    }
    previousStep() {
        if (this.currentStep > 0) {
            this.currentStep--;
            this.showCurrentStep();
            this.saveProgress();
            return true;
        }
        return false;
    }
    goToStep(stepIndex) {
        if (stepIndex >= 0 && stepIndex < this.steps.length) {
            this.currentStep = stepIndex;
            this.showCurrentStep();
            this.saveProgress();
            return true;
        }
        return false;
    }
    validateCurrentStep() {
        return this.stepInstances[this.currentStep].validate();
    }
    validateAllSteps() {
        return this.stepInstances.every(step => step.validate());
    }
    getFormData() {
        const data = {};
        this.stepInstances.forEach(step => {
            Object.assign(data, step.getStepData());
        });
        return data;
    }
    setFormData(data) {
        this.formData = {
            ...this.formData,
            ...data
        };
        this.stepInstances.forEach(step => {
            step.setStepData(this.formData);
        });
    }
    saveProgress() {
        if (!this.saveProgressEnabled) return;
        const progressData = {
            currentStep: this.currentStep,
            formData: this.getFormData(),
            timestamp: Date.now()
        };
        localStorage.setItem(this.storageKey, JSON.stringify(progressData));
    }
    loadSavedProgress() {
        if (!this.saveProgressEnabled) return;
        try {
            const saved = localStorage.getItem(this.storageKey);
            if (saved) {
                const progressData = JSON.parse(saved);
                this.currentStep = progressData.currentStep || 0;
                this.setFormData(progressData.formData || {});
            }
        } catch (e) {
            console.warn('Failed to load saved progress:', e);
        }
    }
    clearSavedProgress() {
        localStorage.removeItem(this.storageKey);
    }
    reset() {
        // Reset step and form data
        this.currentStep = 0;
        this.formData = {};
        // Reset all field instances
        this.stepInstances.forEach(step => {
            step.reset();
            // Also clear any error states
            step.fieldInstances.forEach(field => {
                field.hideError();
                field.setValue('');
            });
        });
        // Clear factory form values
        this.factory.formValues = {};
        // Close any open dropdowns and info panels
        this.factory.closeAllDropdowns();
        this.factory.closeAllInfoPanels();
        // Clear saved progress
        this.clearSavedProgress();
        // Reset UI state
        this.showCurrentStep();
        // Reset any custom field content (like summaries)
        this.stepInstances.forEach(step => {
            step.fieldInstances.forEach(field => {
                if (field.autoSummary && field.updateContent) {
                    setTimeout(() => field.updateContent(), 100);
                }
            });
        });
    }
    submit() {
        if (!this.validateAllSteps()) {
            return false;
        }
        const formData = this.getFormData();
        if (this.onSubmit) {
            const result = this.onSubmit(formData);
            if (result !== false) {
                this.clearSavedProgress();
            }
            return result;
        }
        this.clearSavedProgress();
        return formData;
    }
}
/**
 * FormStep - Enhanced with subsection field support and row layout
 */
class FormStep {
    constructor(multiStepForm, config) {
        this.multiStepForm = multiStepForm;
        this.factory = multiStepForm.factory;
        this.config = config;
        this.index = config.index;
        this.title = config.title || `Step ${this.index + 1}`;
        this.description = config.description || '';
        this.fields = config.fields || [];
        this.validationRules = config.validation || {};
        this.conditionalLogic = config.conditionalLogic || {};
        this.container = null;
        this.fieldInstances = [];
        this.isActive = config.isActive || false;
    }
    render() {
        this.container = document.createElement('div');
        this.container.className = `form-step ${this.isActive ? 'active' : 'hidden'}`;
        this.container.setAttribute('data-step', this.index);
        if (this.title) {
            const titleElement = document.createElement('span');
            titleElement.className = 'step-title';
            titleElement.textContent = this.title;
            this.container.appendChild(titleElement);
        }
        const fieldsContainer = document.createElement('div');
        fieldsContainer.className = 'step-fields';
        // Group fields by row
        const fieldGroups = this.groupFields(this.fields);
        fieldGroups.forEach(group => {
            if (group.isRow) {
                // Create row container
                const rowContainer = document.createElement('div');
                rowContainer.className = 'field-row';
                group.fields.forEach(fieldConfig => {
                    const colContainer = document.createElement('div');
                    colContainer.className = 'field-col';
                    const field = this.createField(fieldConfig);
                    if (field) {
                        this.fieldInstances.push(field);
                        colContainer.appendChild(field.render());
                    }
                    rowContainer.appendChild(colContainer);
                });
                fieldsContainer.appendChild(rowContainer);
            } else {
                // Single field
                const field = this.createField(group.fields[0]);
                if (field) {
                    this.fieldInstances.push(field);
                    fieldsContainer.appendChild(field.render());
                }
            }
        });
        this.container.appendChild(fieldsContainer);
        this.setupConditionalLogic();
        return this.container;
    }
    groupFields(fields) {
        const groups = [];
        let i = 0;
        while (i < fields.length) {
            const currentField = fields[i];
            if (currentField.row) {
                // Find all fields with the same row identifier
                const rowFields = [];
                let j = i;
                while (j < fields.length && fields[j].row === currentField.row) {
                    rowFields.push(fields[j]);
                    j++;
                }
                groups.push({
                    isRow: true,
                    fields: rowFields
                });
                i = j; // Skip the grouped fields
                continue;
            }
            // Single field without row
            groups.push({
                isRow: false,
                fields: [currentField]
            });
            i++;
        }
        return groups;
    }
    createField(config) {
        const fieldType = config.type;
        const fieldConfig = {
            ...config,
            onChange: (value) => {
                this.handleFieldChange(config.name, value);
                if (config.onChange) {
                    config.onChange(value);
                }
            }
        };
        switch (fieldType) {
        case 'text':
            return this.factory.createTextField(fieldConfig);
        case 'email':
            return this.factory.createEmailField(fieldConfig);
        case 'phone':
            return this.factory.createPhoneField(fieldConfig);
        case 'url':
            return this.factory.createUrlField(fieldConfig);
        case 'textarea':
            return this.factory.createTextAreaField(fieldConfig);
        case 'number':
            return this.factory.createNumberField(fieldConfig);
        case 'percentage':
            return this.factory.createPercentageField(fieldConfig);
        case 'options-stepper':
            return this.factory.createOptionsStepperField(fieldConfig);
        case 'yesno':
            return this.factory.createYesNoField(fieldConfig);
        case 'select':
            return this.factory.createSingleSelectField(fieldConfig);
        case 'multiselect':
            return this.factory.createMultiSelectField(fieldConfig);
        case 'select-subsections':
            return this.factory.createSingleSelectSubsectionsField(fieldConfig);
        case 'multiselect-subsections':
            return this.factory.createMultiSelectSubsectionsField(fieldConfig);
        case 'yesno-with-options':
            return this.factory.createYesNoWithOptionsField(fieldConfig);
        case 'select-with-other':
            return this.factory.createSingleSelectWithOtherField(fieldConfig);
        case 'multiselect-with-other':
            return this.factory.createMultiSelectWithOtherField(fieldConfig);
        case 'sliding-window-range':
            return this.factory.createSlidingWindowRangeField(fieldConfig);
        case 'dual-range':
            return this.factory.createDualRangeField(fieldConfig);
        case 'sliding window':
            return this.factory.createSliderField(fieldConfig);
        case 'slider':
            return this.factory.createSlidingWindowSliderField(fieldConfig);
        case 'options-slider':
            return this.factory.createOptionsSliderField(fieldConfig);
        case 'serviceCard':
            return this.factory.createServiceCardField(fieldConfig);
        case 'carousel':
            return this.factory.createCarouselField(fieldConfig);
        case 'filteredCarousel':
            return this.factory.createFilteredCarouselField(fieldConfig);
        case 'service-provider-calendar':
            return this.factory.createServiceProviderCalendarField(fieldConfig);
        case 'calendar':
            return this.factory.createCalendarField(fieldConfig);
        case 'item-calendar':
            return this.factory.createItemCalendarField(fieldConfig);
        case 'image-gallery':
            return this.factory.createImageGalleryField(fieldConfig);
        case 'manager':
            return this.factory.createTabManager(fieldConfig);
        case 'category-item-filter':
            return this.factory.createCategoryItemFilterField(fieldConfig);
        case 'category-item-calendar':
            return this.factory.createCategoryAndItemCalendarField(fieldConfig);
        case 'bookingCancellationCard':
            return this.factory.createBookingCancellationCardField(fieldConfig);
            // ===== NEW CUSTOM FIELD TYPES =====
        case 'service-request-calendar':
        case 'serviceRequestCalendar':
            return this.factory.createServiceRequestCalendarField(fieldConfig);
        case 'terms-checkbox':
        case 'termsCheckbox':
            return this.factory.createTermsCheckboxField(fieldConfig);
        case 'category-request-file-upload':
        case 'categoryRequestFileUpload':
            return this.factory.createCategoryRequestFileUploadField(fieldConfig);
        case 'currentAppointmentCard':
            return this.factory.createCurrentAppointmentCardField(fieldConfig);
        case 'custom':
            // Handle custom fields with render functions
            if (fieldConfig.render && typeof fieldConfig.render === 'function') {
                return fieldConfig.render(this.factory, fieldConfig);
            }
            return new CustomField(this.factory, fieldConfig);
        default:
            console.warn(`Unknown field type: ${fieldType}`);
            return null;
        }
    }
    handleFieldChange(fieldName, value) {
        this.multiStepForm.formData[fieldName] = value;
        this.executeConditionalLogic(fieldName, value);
        this.multiStepForm.saveProgress();
    }
    setupConditionalLogic() {
        Object.keys(this.conditionalLogic)
            .forEach(fieldName => {
                const currentValue = this.multiStepForm.formData[fieldName];
                if (currentValue !== undefined) {
                    this.executeConditionalLogic(fieldName, currentValue);
                }
            });
    }
    executeConditionalLogic(fieldName, value) {
        const logic = this.conditionalLogic[fieldName];
        if (!logic) return;
        logic.forEach(rule => {
            const {
                condition,
                target,
                action
            } = rule;
            const shouldExecute = this.evaluateCondition(condition, value);
            if (shouldExecute) {
                this.executeAction(target, action);
            }
        });
    }
    evaluateCondition(condition, value) {
        if (typeof condition === 'function') {
            return condition(value);
        }
        if (typeof condition === 'object') {
            const {
                equals,
                notEquals,
                includes,
                notIncludes
            } = condition;
            if (equals !== undefined) {
                return value === equals;
            }
            if (notEquals !== undefined) {
                return value !== notEquals;
            }
            if (includes !== undefined) {
                return Array.isArray(value) ? value.includes(includes) : value === includes;
            }
            if (notIncludes !== undefined) {
                return Array.isArray(value) ? !value.includes(notIncludes) : value !== notIncludes;
            }
        }
        return value === condition;
    }
    executeAction(target, action) {
        const field = this.fieldInstances.find(f => f.name === target);
        if (!field) return;
        switch (action.type) {
        case 'show':
            field.show();
            break;
        case 'hide':
            field.hide();
            break;
        case 'enable':
            field.enable();
            break;
        case 'disable':
            field.disable();
            break;
        case 'setValue':
            field.setValue(action.value);
            break;
        case 'setOptions':
            if (field.setOptions) {
                field.setOptions(action.options);
            }
            break;
        }
    }
    setActive(active) {
        this.isActive = active;
        if (this.container) {
            this.container.classList.toggle('active', active);
            this.container.classList.toggle('hidden', !active);
        }
    }
    validate() {
        let isValid = true;
        this.fieldInstances.forEach(field => {
            if (!field.validate()) {
                isValid = false;
            }
        });
        return isValid;
    }
    getStepData() {
        const data = {};
        this.fieldInstances.forEach(field => {
            data[field.name] = field.getValue();
        });
        return data;
    }
    setStepData(data) {
        this.fieldInstances.forEach(field => {
            if (data[field.name] !== undefined) {
                field.setValue(data[field.name]);
            }
        });
    }
    reset() {
        this.fieldInstances.forEach(field => {
            field.setValue('');
        });
    }
}
/**
 * ProgressBar - Progress bar for multi-step forms
 */
class ProgressBar {
    constructor(multiStepForm, config) {
        this.multiStepForm = multiStepForm;
        this.config = config;
        this.totalSteps = config.totalSteps;
        this.currentStep = config.currentStep || 0;
        this.showStepNumbers = config.showStepNumbers !== false;
        this.showStepTitles = config.showStepTitles !== false;
        this.container = null;
        this.progressFill = null;
        this.stepInfo = null;
    }
    render() {
        this.container = document.createElement('div');
        this.container.className = 'progress-container';
        const progressBar = document.createElement('div');
        progressBar.className = 'progress-bar';
        this.progressFill = document.createElement('div');
        this.progressFill.className = 'progress-fill';
        progressBar.appendChild(this.progressFill);
        this.container.appendChild(progressBar);
        if (this.showStepNumbers || this.showStepTitles) {
            this.stepInfo = document.createElement('div');
            this.stepInfo.className = 'step-info';
            this.container.appendChild(this.stepInfo);
        }
        this.updateProgress(this.currentStep);
        return this.container;
    }
    updateProgress(currentStep) {
        this.currentStep = currentStep;
        if (this.progressFill) {
            const progress = (currentStep / (this.totalSteps - 1)) * 100;
            this.progressFill.style.width = `${Math.min(progress, 100)}%`;
        }
        if (this.stepInfo) {
            let infoText = '';
            if (this.showStepNumbers) {
                infoText += `${this.multiStepForm.factory.getText('step')} ${currentStep + 1} ${this.multiStepForm.factory.getText('of')} ${this.totalSteps}`;
            }
            if (this.showStepTitles && this.multiStepForm.steps[currentStep]) {
                const stepTitle = this.multiStepForm.steps[currentStep].title;
                if (stepTitle) {
                    if (infoText) infoText += ' - ';
                    infoText += stepTitle;
                }
            }
            this.stepInfo.textContent = infoText;
        }
    }
}
/**
 * NavigationButtons - Navigation buttons for multi-step forms
 */
class NavigationButtons {
    constructor(multiStepForm) {
        this.multiStepForm = multiStepForm;
        this.factory = multiStepForm.factory;
        this.container = null;
        this.prevButton = null;
        this.nextButton = null;
        this.submitButton = null;
    }
    render() {
        this.container = document.createElement('div');
        this.container.className = 'form-navigation';
        this.prevButton = document.createElement('button');
        this.prevButton.type = 'button';
        this.prevButton.className = 'btn btn-prev';
        this.prevButton.textContent = this.factory.getText('previous');
        this.prevButton.addEventListener('click', () => {
            this.multiStepForm.previousStep();
        });
        this.nextButton = document.createElement('button');
        this.nextButton.type = 'button';
        this.nextButton.className = 'btn btn-next';
        this.nextButton.textContent = this.factory.getText('next');
        this.nextButton.addEventListener('click', () => {
            this.multiStepForm.nextStep();
        });
        this.submitButton = document.createElement('button');
        this.submitButton.type = 'button';
        this.submitButton.className = 'btn btn-submit';
        this.submitButton.textContent = this.factory.getText('submit');
        this.submitButton.addEventListener('click', () => {
            this.multiStepForm.submit();
        });
        this.container.appendChild(this.prevButton);
        this.container.appendChild(this.nextButton);
        this.container.appendChild(this.submitButton);
        return this.container;
    }
    updateButtons(currentStep, totalSteps) {
        this.prevButton.style.display = currentStep > 0 ? 'inline-block' : 'none';
        return this.container;
    }
    updateButtons(currentStep, totalSteps) {
        this.prevButton.style.display = currentStep > 0 ? 'inline-block' : 'none';
        if (currentStep === totalSteps - 1) {
            this.nextButton.style.display = 'none';
            this.submitButton.style.display = 'inline-block';
        } else {
            this.nextButton.style.display = 'inline-block';
            this.submitButton.style.display = 'none';
        }
    }
}

export { MultiStepForm, FormStep, ProgressBar, NavigationButtons };
