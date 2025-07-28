// ============================================================================
// ENHANCED FIELD VALUE FORMATTER - More robust formatting logic
// ============================================================================
class FieldValueFormatter {
    constructor(creatFormInstance) {
        this.creatFormInstance = creatFormInstance;
        this.config = creatFormInstance?.config || {};
        this.language = this.config.language || 'fr';
        // Fallback translations for when the system fails
        this.fallbackTranslations = {
            fr: {
                'common.yes': 'Oui',
                'common.no': 'Non',
                'common.other': 'Autre',
                'common.notSpecified': 'Non spécifié',
                'common.none': 'Aucun'
            },
            en: {
                'common.yes': 'Yes',
                'common.no': 'No',
                'common.other': 'Other',
                'common.notSpecified': 'Not specified',
                'common.none': 'None'
            }
        };
    }
    /**
     * UPDATED: Main formatting method with enhanced object handling
     */
    formatValue(fieldConfig, value, context = {}) {
        if (!this.shouldDisplayValue(value)) {
            return context.returnEmpty ? '' : this.getTranslatedText('common.notSpecified');
        }
        const fieldType = fieldConfig?.type;
        try {
            // FIX: Handle special field types first
            if (fieldType === 'category-item-filter') {
                return this.formatCategoryItemFilterValue(value, fieldConfig);
            }
            if (fieldType === 'service-request-calendar') {
                return this.formatServiceRequestCalendarValue(value, fieldConfig);
            }
            // Handle complex objects with special formatting
            if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
                return this.formatComplexObjectValue(value, fieldConfig);
            }
            // Regular field type handling
            switch (fieldType) {
            case 'yesno':
                return this.formatYesNoValue(value, fieldConfig);
            case 'yesno-with-options':
                return this.formatYesNoWithOptionsValue(value, fieldConfig, context);
            case 'select':
            case 'select-subsections':
                return this.formatSelectValue(value, fieldConfig);
            case 'multiselect':
            case 'multiselect-subsections':
                return this.formatMultiSelectValue(value, fieldConfig);
            case 'select-with-other':
                return this.formatSelectWithOtherValue(value, fieldConfig);
            case 'multiselect-with-other':
                return this.formatMultiSelectWithOtherValue(value, fieldConfig);
            case 'sliding-window-range':
                return this.formatSlidingWindowRangeValue(value, fieldConfig);
            case 'options-slider':
                return this.formatOptionsSliderValue(value, fieldConfig);
            case 'textarea':
                return this.formatTextareaValue(value, context);
            case 'email':
            case 'phone':
            case 'url':
                return this.formatContactValue(value);
            case 'number':
            case 'percentage':
                return this.formatNumericValue(value, fieldConfig);
            default:
                return this.formatDefaultValue(value);
            }
        } catch (error) {
            console.error('🎨 Error formatting value:', error, {
                fieldType,
                value
            });
            return this.safeStringConversion(value);
        }
    }
    /**
     * Extract structured data for complex fields (like yesno-with-options)
     * FIXED: No circular calls to formatValue()
     */
    extractStructuredValue(fieldConfig, value) {
        if (!this.shouldDisplayValue(value)) {
            return {
                displayValue: '',
                rawValue: value,
                hasSubFields: false
            };
        }
        const result = {
            displayValue: this.formatValueDirectly(fieldConfig, value), // FIXED: Use direct formatting
            rawValue: value,
            hasSubFields: false,
            subFields: {}
        };
        // Handle yesno-with-options specially
        if (fieldConfig.type === 'yesno-with-options' && typeof value === 'object' && value.main !== undefined) {
            result.mainValue = value.main;
            result.mainDisplayValue = this.formatYesNoValue(value.main, fieldConfig);
            result.hasSubFields = true;
            // Determine which sub-fields to include
            const showYesFields = this.isYesValue(value.main, fieldConfig);
            const showNoFields = this.isNoValue(value.main, fieldConfig);
            if (showYesFields && value.yesValues) {
                result.subFields = this.extractSubFieldValues(
                    fieldConfig.yesFields || (fieldConfig.yesField ? [fieldConfig.yesField] : []),
                    value.yesValues
                );
            } else if (showNoFields && value.noValues) {
                result.subFields = this.extractSubFieldValues(
                    fieldConfig.noFields || (fieldConfig.noField ? [fieldConfig.noField] : []),
                    value.noValues
                );
            }
        }
        return result;
    }
    /**
     * Extract sub-field values for conditional fields
     */
    extractSubFieldValues(subFieldConfigs, subFieldValues) {
        const extracted = {};
        if (!Array.isArray(subFieldConfigs) || !subFieldValues) {
            return extracted;
        }
        subFieldConfigs.forEach(subFieldConfig => {
            const fieldName = subFieldConfig.name || subFieldConfig.id;
            const fieldValue = subFieldValues[fieldName];
            if (this.shouldDisplayValue(fieldValue)) {
                extracted[fieldName] = {
                    label: subFieldConfig.label,
                    displayValue: this.formatValueDirectly(subFieldConfig, fieldValue), // FIXED: Use direct formatting
                    rawValue: fieldValue,
                    fieldType: subFieldConfig.type
                };
            }
        });
        return extracted;
    }
    // ============================================================================
    // NEW: Direct formatting method without circular calls
    // ============================================================================
    /**
     * Format value directly without calling extractStructuredValue (prevents recursion)
     */
    formatValueDirectly(fieldConfig, value, context = {}) {
        if (!this.shouldDisplayValue(value)) {
            return context.returnEmpty ? '' : this.getTranslatedText('common.notSpecified');
        }
        const fieldType = fieldConfig?.type;
        try {
            // FIX: Handle special field types first
            if (fieldType === 'category-item-filter') {
                return this.formatCategoryItemFilterValue(value, fieldConfig);
            }
            if (fieldType === 'service-request-calendar') {
                return this.formatServiceRequestCalendarValue(value, fieldConfig);
            }
            switch (fieldType) {
            case 'yesno':
                return this.formatYesNoValue(value, fieldConfig);
            case 'yesno-with-options':
                // FIXED: Don't call extractStructuredValue, just format the main value
                if (typeof value === 'object' && value.main !== undefined) {
                    return this.formatYesNoValue(value.main, fieldConfig);
                }
                return this.formatYesNoValue(value, fieldConfig);
            case 'select':
            case 'select-subsections':
                return this.formatSelectValue(value, fieldConfig);
            case 'multiselect':
            case 'multiselect-subsections':
                return this.formatMultiSelectValue(value, fieldConfig);
            case 'select-with-other':
                return this.formatSelectWithOtherValue(value, fieldConfig);
            case 'multiselect-with-other':
                return this.formatMultiSelectWithOtherValue(value, fieldConfig);
            case 'sliding-window-range':
                return this.formatSlidingWindowRangeValue(value, fieldConfig);
            case 'options-slider':
                return this.formatOptionsSliderValue(value, fieldConfig);
            case 'textarea':
                return this.formatTextareaValue(value, context);
            case 'email':
            case 'phone':
            case 'url':
                return this.formatContactValue(value);
            case 'number':
            case 'percentage':
                return this.formatNumericValue(value, fieldConfig);
            default:
                return this.formatDefaultValue(value);
            }
        } catch (error) {
            console.error('🎨 Error in direct formatting:', error);
            return this.formatDefaultValue(value);
        }
    }
    // ============================================================================
    // NEW METHODS FOR SPECIAL FIELD TYPES
    // ============================================================================
    /**
     * NEW: Format CategoryItemFilterField values
     */
    formatCategoryItemFilterValue(value, fieldConfig) {
        if (typeof value === 'object' && value !== null) {
            // Handle the structured object from CategoryItemFilterField
            if (value._separateFields) {
                const parts = [];
                if (value.category && String(value.category)
                    .trim() !== '') {
                    parts.push(String(value.category));
                }
                if (value.item && String(value.item)
                    .trim() !== '') {
                    parts.push(String(value.item));
                }
                return parts.join(' - ');
            }
            // Handle other object formats
            if (value.selectedCategory && value.selectedItem) {
                const itemName = value.selectedItem.displayName || value.selectedItem.name || String(value.selectedItem);
                return `${value.selectedCategory} - ${itemName}`;
            }
            if (value.displayText) {
                return String(value.displayText);
            }
            // Try toString method
            if (typeof value.toString === 'function' && value.toString !== Object.prototype.toString) {
                return value.toString();
            }
        }
        return this.safeStringConversion(value);
    }
    /**
     * UPDATED: Format ServiceRequestCalendar values with HTML line breaks
     */
    formatServiceRequestCalendarValue(value, fieldConfig) {
        if (Array.isArray(value)) {
            const formattedSlots = value.map(slot => {
                if (typeof slot === 'object' && slot.displayText) {
                    return slot.displayText;
                }
                if (typeof slot === 'object' && slot.date && slot.timeOfDay) {
                    return `${slot.date} - ${slot.timeOfDay}`;
                }
                return this.safeStringConversion(slot);
            });
            // FIX: Use HTML line breaks instead of \n for proper display
            if (formattedSlots.length > 1) {
                return formattedSlots.map(slot => `• ${slot}`)
                    .join('<br>');
            } else if (formattedSlots.length === 1) {
                return formattedSlots[0]; // Single item doesn't need bullet
            }
            return '';
        }
        return this.safeStringConversion(value);
    }
    /**
     * NEW: Format complex object values
     */
    formatComplexObjectValue(value, fieldConfig) {
        // Check for common display properties
        if (value.displayText) {
            return String(value.displayText);
        }
        if (value.display) {
            return String(value.display);
        }
        if (value.label) {
            return this.getLocalizedLabel(value.label);
        }
        if (value.name) {
            return String(value.name);
        }
        if (value.value !== undefined) {
            return this.safeStringConversion(value.value);
        }
        // Handle objects with toString method
        if (typeof value.toString === 'function' && value.toString !== Object.prototype.toString) {
            try {
                const result = value.toString();
                if (result && result !== '[object Object]') {
                    return result;
                }
            } catch (error) {
                console.warn('Error calling toString:', error);
            }
        }
        // Handle structured objects with multiple fields
        if (typeof value === 'object') {
            const meaningfulFields = [];
            // Common field names to extract
            const fieldNames = ['title', 'description', 'category', 'item', 'type', 'status'];
            fieldNames.forEach(fieldName => {
                if (value[fieldName] && this.shouldDisplayValue(value[fieldName])) {
                    meaningfulFields.push(this.safeStringConversion(value[fieldName]));
                }
            });
            if (meaningfulFields.length > 0) {
                return meaningfulFields.join(' - ');
            }
        }
        // Last resort
        return this.safeStringConversion(value);
    }
    // ============================================================================
    // ENHANCED FIELD-SPECIFIC FORMATTING METHODS
    // ============================================================================
    formatYesNoValue(value, fieldConfig) {
        // Handle custom options first
        if (fieldConfig?.customOptions && Array.isArray(fieldConfig.customOptions)) {
            const option = fieldConfig.customOptions.find(opt => opt.value === value);
            if (option) {
                return this.getLocalizedLabel(option.label);
            }
        }
        // Standard yes/no
        if (this.isYesValue(value, fieldConfig)) {
            return this.getTranslatedText('common.yes');
        }
        if (this.isNoValue(value, fieldConfig)) {
            return this.getTranslatedText('common.no');
        }
        return this.safeStringConversion(value);
    }
    formatYesNoWithOptionsValue(value, fieldConfig, context = {}) {
        if (typeof value !== 'object' || value.main === undefined) {
            return this.formatYesNoValue(value, fieldConfig);
        }
        // FIXED: Don't call extractStructuredValue to avoid recursion
        // Just format the main value for summary mode or detailed contexts
        return this.formatYesNoValue(value.main, fieldConfig);
    }
    formatSelectValue(value, fieldConfig) {
        return this.getOptionDisplayName(fieldConfig?.options, value, fieldConfig);
    }
    formatMultiSelectValue(value, fieldConfig) {
        if (!Array.isArray(value)) {
            return this.formatSelectValue(value, fieldConfig);
        }
        return value.map(v => this.getOptionDisplayName(fieldConfig?.options, v, fieldConfig));
    }
    formatSelectWithOtherValue(value, fieldConfig) {
        if (typeof value === 'object' && value.main) {
            if (value.main === 'other' && value.other) {
                return String(value.other)
                    .trim();
            }
            return this.getOptionDisplayName(fieldConfig?.options, value.main, fieldConfig);
        }
        return this.getOptionDisplayName(fieldConfig?.options, value, fieldConfig);
    }
    formatMultiSelectWithOtherValue(value, fieldConfig) {
        if (typeof value === 'object' && value.main) {
            const mainValues = Array.isArray(value.main) ?
                value.main.map(v => this.getOptionDisplayName(fieldConfig?.options, v, fieldConfig)) : [];
            if (value.other && String(value.other)
                .trim()) {
                mainValues.push(String(value.other)
                    .trim());
            }
            return mainValues;
        }
        return Array.isArray(value) ? value : [value];
    }
    formatContactValue(value) {
        return value ? String(value)
            .trim() : '';
    }
    formatNumericValue(value, fieldConfig) {
        if (typeof value === 'number') {
            const formatted = fieldConfig?.type === 'percentage' ? `${value}%` : value.toString();
            return formatted;
        }
        return this.safeStringConversion(value);
    }
    formatTextareaValue(value, context = {}) {
        if (typeof value === 'string') {
            if (context.summaryMode && value.length > 100) {
                return value.substring(0, 100) + '...';
            }
        }
        return this.safeStringConversion(value);
    }
    formatSlidingWindowRangeValue(value, fieldConfig) {
        if (typeof value === 'object' && value.min !== undefined && value.max !== undefined) {
            const formatValue = fieldConfig?.formatValue || ((val) => `${parseInt(val).toLocaleString()}`);
            return `${formatValue(value.min)} - ${formatValue(value.max)}`;
        }
        return this.safeStringConversion(value);
    }
    formatOptionsSliderValue(value, fieldConfig) {
        if (typeof value === 'object' && value.display) {
            return String(value.display);
        }
        if (fieldConfig?.options && Array.isArray(fieldConfig.options)) {
            const option = fieldConfig.options.find(opt => opt.value === value);
            if (option) {
                return option.display || option.label || String(value);
            }
        }
        return this.safeStringConversion(value);
    }
    formatDefaultValue(value) {
        return this.safeStringConversion(value);
    }
    // ============================================================================
    // ENHANCED: Safe string conversion method with HTML line breaks for calendars
    // ============================================================================
    /**
     * UPDATED: Safe string conversion method with HTML line breaks for calendar arrays
     */
    safeStringConversion(value, fieldConfig = null) {
        // Handle null/undefined
        if (value === null || value === undefined) {
            return '';
        }
        // Handle arrays with special formatting for calendar fields
        if (Array.isArray(value)) {
            // Check if this is a calendar field array
            const isCalendarArray = value.some(item =>
                typeof item === 'object' && (item.displayText || (item.date && item.timeOfDay))
            );
            if (isCalendarArray && value.length > 1) {
                // FIX: Use HTML line breaks for calendar arrays with multiple items
                return value.map(item => {
                        const formatted = this.safeStringConversion(item);
                        return formatted ? `• ${formatted}` : '';
                    })
                    .filter(item => item !== '')
                    .join('<br>');
            } else {
                // Regular array formatting with commas
                return value.map(item => this.safeStringConversion(item))
                    .filter(item => item !== '')
                    .join(', ');
            }
        }
        // Handle objects
        if (typeof value === 'object' && value !== null) {
            // Check for calendar-specific properties first
            if (value.displayText) {
                return String(value.displayText);
            }
            if (value.date && value.timeOfDay) {
                return `${value.date} - ${value.timeOfDay}`;
            }
            // Try toString first
            if (typeof value.toString === 'function' && value.toString !== Object.prototype.toString) {
                try {
                    const result = value.toString();
                    if (result && result !== '[object Object]') {
                        return result;
                    }
                } catch (error) {
                    console.warn('Error calling toString:', error);
                }
            }
            // Check for other common display fields
            if (value.display) {
                return String(value.display);
            }
            if (value.label) {
                return String(value.label);
            }
            if (value.name) {
                return String(value.name);
            }
            if (value.value !== undefined) {
                return String(value.value);
            }
            // Try JSON.stringify as last resort
            try {
                const jsonStr = JSON.stringify(value);
                if (jsonStr && jsonStr !== '{}' && jsonStr !== 'null') {
                    return jsonStr;
                }
            } catch (error) {
                console.warn('Error stringifying object:', error);
            }
            return String(value);
        }
        // Handle primitives
        return String(value);
    }
    // ============================================================================
    // UTILITY METHODS
    // ============================================================================
    /**
     * UPDATED: shouldDisplayValue with better object checking
     */
    shouldDisplayValue(value) {
        if (value === undefined || value === null || value === '') {
            return false;
        }
        if (Array.isArray(value) && value.length === 0) {
            return false;
        }
        // Handle objects
        if (typeof value === 'object' && value !== null) {
            // Check if object has meaningful content
            if (value._separateFields) {
                // For CategoryItemFilterField-like objects
                return !!(value.category || value.item);
            }
            // Check for common meaningful properties
            const meaningfulProps = ['displayText', 'display', 'label', 'name', 'value', 'selectedCategory', 'selectedItem', 'date', 'timeOfDay'];
            const hasMeaningfulContent = meaningfulProps.some(prop => {
                const propValue = value[prop];
                return propValue !== undefined && propValue !== null && propValue !== '';
            });
            if (hasMeaningfulContent) {
                return true;
            }
            // Check if object has any non-empty values
            try {
                const stringified = JSON.stringify(value);
                return stringified !== '{}' && stringified !== 'null' && stringified !== '[]';
            } catch (error) {
                return true; // If we can't stringify, assume it has content
            }
        }
        return true;
    }
    isYesValue(value, fieldConfig) {
        if (fieldConfig?.customOptions && Array.isArray(fieldConfig.customOptions)) {
            return value === fieldConfig.customOptions[0]?.value;
        }
        return value === true || value === 'yes' || value === 'true';
    }
    isNoValue(value, fieldConfig) {
        if (fieldConfig?.customOptions && Array.isArray(fieldConfig.customOptions)) {
            return value === fieldConfig.customOptions[1]?.value;
        }
        return value === false || value === 'no' || value === 'false';
    }
    getOptionDisplayName(options, value, fieldConfig) {
        if (!options || !value) return this.safeStringConversion(value);
        // Handle data path resolution
        if (typeof options === 'string' && this.creatFormInstance) {
            try {
                options = this.creatFormInstance.getData(options);
            } catch (error) {
                console.error('Error getting data for options path:', options, error);
                return this.safeStringConversion(value);
            }
        }
        // Handle subsection options (for select-subsections)
        if (fieldConfig?.type === 'select-subsections' || fieldConfig?.type === 'multiselect-subsections') {
            if (fieldConfig.subsectionOptions || fieldConfig.options) {
                const subsections = fieldConfig.subsectionOptions || fieldConfig.options;
                for (const section of subsections) {
                    if (section.subcategories) {
                        const option = section.subcategories.find(opt => opt.id === value);
                        if (option) {
                            return this.getLocalizedLabel(option.name || option.label);
                        }
                    }
                }
            }
        }
        // Handle regular options array
        if (Array.isArray(options)) {
            const option = options.find(opt => opt.id === value);
            if (option) {
                return this.getLocalizedLabel(option.name || option.label);
            }
        }
        return this.safeStringConversion(value);
    }
    getLocalizedLabel(label) {
        if (typeof label === 'object' && label !== null) {
            return label[this.language] || label.en || label.fr || Object.values(label)[0];
        }
        return String(label || '');
    }
    getTranslatedText(path) {
        try {
            // Method 1: Try the creatFormInstance getText method
            if (this.creatFormInstance && this.creatFormInstance.getText) {
                const translated = this.creatFormInstance.getText(path);
                if (translated && translated !== path && !translated.includes('.')) {
                    return translated;
                }
            }
            // Method 2: Try direct access to form data translations
            if (this.creatFormInstance && this.creatFormInstance.formData && this.creatFormInstance.formData.translations) {
                const translations = this.creatFormInstance.formData.translations[this.language];
                if (translations) {
                    const keys = path.split('.');
                    let value = translations;
                    for (const key of keys) {
                        value = value?.[key];
                    }
                    if (value && typeof value === 'string') {
                        return value;
                    }
                }
            }
            // Method 3: Try fallback translations
            const fallback = this.fallbackTranslations[this.language]?.[path];
            if (fallback) {
                return fallback;
            }
            // Method 4: Try English fallback
            const englishFallback = this.fallbackTranslations.en?.[path];
            if (englishFallback) {
                return englishFallback;
            }
            return path;
        } catch (error) {
            console.error('Error getting translated text:', error);
            return this.fallbackTranslations[this.language]?.[path] ||
                this.fallbackTranslations.en?.[path] ||
                path;
        }
    }
}
// ============================================================================
// 2. FORM DATA PROCESSOR - Generic processor using field configurations
// ============================================================================
class FormDataProcessor {
    constructor(creatFormInstance) {
        this.creatFormInstance = creatFormInstance;
        this.formatter = new FieldValueFormatter(creatFormInstance);
        this.config = creatFormInstance?.config || {};
        this.language = this.config.language || 'fr';
    }
    /**
     * Process form data using field configurations (same approach as CustomField)
     */
    processFormData(originalFormValues) {
        const fieldConfigurations = this.getFieldConfigurations();
        const processedData = {};
        // Process each field value using its configuration
        Object.keys(originalFormValues)
            .forEach(fieldName => {
                const fieldValue = originalFormValues[fieldName];
                const fieldConfig = this.findFieldConfiguration(fieldName, fieldConfigurations);
                if (fieldConfig && this.formatter.shouldDisplayValue(fieldValue)) {
                    processedData[fieldName] = this.processFieldValue(fieldConfig, fieldValue, originalFormValues);
                }
            });
        return processedData;
    }
    /**
     * Process individual field value using the same technique as CustomField
     */
    processFieldValue(fieldConfig, fieldValue, allFormValues) {
        // Get the structured value extraction (like CustomField does)
        const structured = this.formatter.extractStructuredValue(fieldConfig, fieldValue);
        return {
            fieldId: fieldConfig.id || fieldConfig.name,
            fieldType: fieldConfig.type,
            label: this.getFieldLabel(fieldConfig),
            displayValue: structured.displayValue,
            rawValue: structured.rawValue,
            // For complex fields, include structured information
            ...(structured.hasSubFields && {
                mainValue: structured.mainValue,
                mainDisplayValue: structured.mainDisplayValue,
                subFields: structured.subFields
            }),
            // For array fields, provide different formats
            ...(Array.isArray(structured.displayValue) && {
                array: structured.displayValue,
                string: structured.displayValue.join(', '),
                count: structured.displayValue.length
            })
        };
    }
    /**
     * Get field configurations from the form (same as CustomField approach)
     */
    getFieldConfigurations() {
        const configs = [];
        if (this.creatFormInstance.formConfig?.steps) {
            this.creatFormInstance.formConfig.steps.forEach(stepConfig => {
                if (stepConfig.fields) {
                    configs.push(...this.extractFieldConfigs(stepConfig.fields));
                }
            });
        }
        return configs;
    }
    /**
     * Extract field configurations including nested fields (yesFields, noFields, etc.)
     */
    extractFieldConfigs(fields) {
        const configs = [];
        fields.forEach(fieldConfig => {
            configs.push(fieldConfig);
            // Extract nested field configurations
            if (fieldConfig.yesFields) {
                configs.push(...this.extractFieldConfigs(fieldConfig.yesFields));
            }
            if (fieldConfig.yesField) {
                configs.push(fieldConfig.yesField);
            }
            if (fieldConfig.noFields) {
                configs.push(...this.extractFieldConfigs(fieldConfig.noFields));
            }
            if (fieldConfig.noField) {
                configs.push(fieldConfig.noField);
            }
        });
        return configs;
    }
    /**
     * Find field configuration by name (same as CustomField approach)
     */
    findFieldConfiguration(fieldName, fieldConfigurations) {
        return fieldConfigurations.find(config =>
            (config.name === fieldName) ||
            (config.id === fieldName)
        ) || null;
    }
    /**
     * Get field label using the same approach as CustomField
     */
    getFieldLabel(fieldConfig) {
        const fieldId = fieldConfig.id || fieldConfig.name;
        // Try to get translated label
        if (this.creatFormInstance.getText) {
            const translatedLabel = this.creatFormInstance.getText(`fields.${fieldId}`);
            if (translatedLabel && translatedLabel !== `fields.${fieldId}`) {
                return translatedLabel;
            }
        }
        // Fallback to config label
        return fieldConfig.label || fieldId;
    }
    /**
     * Create sections based on form structure (not hardcoded field names)
     */
    createSections(processedData) {
        const sections = {};
        if (this.creatFormInstance.formConfig?.steps) {
            this.creatFormInstance.formConfig.steps.forEach((stepConfig, stepIndex) => {
                const sectionData = this.createSectionFromStep(stepConfig, stepIndex, processedData);
                if (Object.keys(sectionData)
                    .length > 0) {
                    const sectionId = this.getSectionId(stepConfig, stepIndex);
                    sections[sectionId] = {
                        sectionType: sectionId,
                        title: this.getSectionTitle(stepConfig, stepIndex),
                        index: stepIndex,
                        ...sectionData
                    };
                }
            });
        }
        return sections;
    }
    /**
     * Create section data from step configuration
     */
    createSectionFromStep(stepConfig, stepIndex, processedData) {
        const sectionData = {};
        if (stepConfig.fields) {
            stepConfig.fields.forEach(fieldConfig => {
                const fieldName = fieldConfig.id || fieldConfig.name;
                const fieldData = processedData[fieldName];
                if (fieldData) {
                    sectionData[fieldName] = fieldData;
                }
            });
        }
        return sectionData;
    }
    /**
     * Get section ID from step configuration
     */
    getSectionId(stepConfig, stepIndex) {
        if (stepConfig.sectionId) {
            return stepConfig.sectionId;
        }
        // Generate semantic section IDs based on content
        const fieldTypes = stepConfig.fields?.map(f => f.type) || [];
        if (fieldTypes.includes('email') || fieldTypes.includes('phone')) {
            return 'contact_information';
        }
        if (fieldTypes.includes('textarea') && stepConfig.fields?.some(f => f.id?.includes('description'))) {
            return 'project_details';
        }
        if (fieldTypes.includes('serviceCard') || fieldTypes.includes('calendar')) {
            return 'service_selection';
        }
        if (fieldTypes.includes('yesno-with-options')) {
            return 'feature_configuration';
        }
        return `step_${stepIndex}`;
    }
    /**
     * Get section title from step configuration
     */
    getSectionTitle(stepConfig, stepIndex) {
        // Try to get translated title
        if (this.creatFormInstance.getText) {
            const translatedTitle = this.creatFormInstance.getText(`steps.${stepIndex}.title`);
            if (translatedTitle && translatedTitle !== `steps.${stepIndex}.title`) {
                return translatedTitle;
            }
        }
        // Fallback to config title or generated title
        return stepConfig.title || `Step ${stepIndex + 1}`;
    }
}
// ============================================================================
// 3. UPDATED BASE DATA TRANSFORMER - Uses FormDataProcessor
// ============================================================================
class BaseDataTransformer {
    constructor(creatFormInstance) {
        this.creatFormInstance = creatFormInstance;
        this.processor = new FormDataProcessor(creatFormInstance);
        this.config = creatFormInstance?.config || {};
        this.language = this.config.language || 'fr';
    }
    /**
     * Main transformation method - no more flatData!
     */
    transform(originalFormValues) {
        console.log('BaseDataTransformer: Starting transformation...', {
            originalFormValues
        });
        // Process form data using field configurations (same as CustomField)
        const processedData = this.processor.processFormData(originalFormValues);
        // Create structured format
        return {
            submissionType: this.getSubmissionType(),
            formVersion: this.getFormVersion(),
            submissionTimestamp: new Date()
                .toISOString(),
            language: this.language,
            // Create sections using processed data
            sections: this.processor.createSections(processedData),
            // Keep processed field data for direct access
            processedFields: processedData,
            // Add metadata
            metadata: this.generateMetadata(originalFormValues, processedData)
        };
    }
    /**
     * Generate metadata
     */
    generateMetadata(originalFormValues, processedData) {
        return {
            transformationTimestamp: new Date()
                .toISOString(),
            transformerType: this.constructor.name,
            totalFields: Object.keys(originalFormValues)
                .length,
            processedFields: Object.keys(processedData)
                .length,
            completionPercentage: this.calculateCompletionPercentage(originalFormValues),
            formStructure: this.determineFormStructure()
        };
    }
    /**
     * Calculate completion percentage
     */
    calculateCompletionPercentage(formValues) {
        const fieldConfigs = this.processor.getFieldConfigurations();
        const totalFields = fieldConfigs.length;
        const completedFields = Object.keys(formValues)
            .filter(key =>
                this.processor.formatter.shouldDisplayValue(formValues[key])
            )
            .length;
        return totalFields > 0 ? Math.round((completedFields / totalFields) * 100) : 0;
    }
    /**
     * Determine form structure
     */
    determineFormStructure() {
        const steps = this.creatFormInstance.formConfig?.steps?.length || 1;
        return steps > 1 ? 'multi-step' : 'single-step';
    }
    /**
     * Get submission type
     */
    getSubmissionType() {
        return this.config.formType === "booking" ? "booking_form" : "submission_form";
    }
    /**
     * Get form version
     */
    getFormVersion() {
        return this.creatFormInstance?.defaultConfig?.FORM_VERSION || '1.0.0';
    }
}
class FormFieldFactory {
    constructor(options = {}) {
        this.container = options.container || document.body;
        this.formValues = options.formValues || {};
        this.onChangeCallback = options.onChange || null;
        this.currentMultiStepForm = null;
        this.fieldRegistry = {};
        // Add global click management
        this.openDropdowns = new Set();
        this.openInfoPanels = new Set();
        this.globalClickHandlerAttached = false;
        // Enhanced texts with summary support
        this.texts = {
            required: options.texts?.required || "required",
            selectPlaceholder: options.texts?.selectPlaceholder || "-- Select --",
            selectMultiplePlaceholder: options.texts?.selectMultiplePlaceholder || "-- Multiple selection --",
            selectSubsectionPlaceholder: options.texts?.selectSubsectionPlaceholder || "-- Select from categories --",
            yes: options.texts?.yes || "Yes",
            no: options.texts?.no || "No",
            other: options.texts?.other || "Other",
            fieldRequired: options.texts?.fieldRequired || "This field is required",
            emailInvalid: options.texts?.emailInvalid || "Invalid email format",
            phoneInvalid: options.texts?.phoneInvalid || "Invalid phone format",
            urlInvalid: options.texts?.urlInvalid || "Invalid URL format",
            selectAtLeastOne: options.texts?.selectAtLeastOne || "Please select at least one option",
            selectAll: options.texts?.selectAll || "Select All",
            selected: options.texts?.selected || "selected",
            next: options.texts?.next || "Next",
            previous: options.texts?.previous || "Previous",
            submit: options.texts?.submit || "Submit",
            step: options.texts?.step || "Step",
            of: options.texts?.of || "of",
            edit: options.texts?.edit || "Edit",
            noDataEntered: options.texts?.noDataEntered || "No data entered",
            categoryRequired: options.texts?.categoryRequired || "Please select a category",
            dateTimeRequired: options.texts?.dateTimeRequired || "Please select a date and time"
        };
        // ============================================================================
        // NEW: Initialize FormDataProcessor and FieldValueFormatter
        // ============================================================================
        this.dataProcessor = null; // Will be set when CreatForm instance is available
        this.formatter = null; // Will be set when CreatForm instance is available
        // SVG Icons - All icons used by fields should be defined here
        this.SVG_ICONS = {
            CHECK: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" width="12px" height="12px">
        <path fill="currentColor" d="M438.6 105.4c12.5 12.5 12.5 32.8 0 45.3l-256 256c-12.5 12.5-32.8 12.5-45.3 0l-128-128c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0L160 338.7 393.4 105.4c12.5-12.5 32.8-12.5 45.3 0z"/>
    </svg>`,
            CHEVRON: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 662 662" width="18px" height="18px">
        <g transform="translate(75, 75)">
            <path fill="currentColor" d="M233.4 406.6c12.5 12.5 32.8 12.5 45.3 0l192-192c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L256 338.7 86.6 169.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3l192 192z"/>
        </g>
    </svg>`,
            INFO: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="18px" height="18px">
        <path class="info-bg" fill="currentColor" d="M256 512A256 256 0 1 0 256 0a256 256 0 1 0 0 512z"/>
        <path class="info-icon" fill="currentColor" d="M216 336l24 0 0-64-24 0 c-13.3 0-24-10.7-24-24s10.7-24 24-24 l48 0c13.3 0 24 10.7 24 24l0 88 8 0c13.3 0 24 10.7 24 24s-10.7 24-24 24 l-80 0c-13.3 0-24-10.7-24-24s10.7-24 24-24zm40-208 a32 32 0 1 1 0 64 32 32 0 1 1 0-64z"/>
    </svg>`,
            CLOSE: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512" width="8px" height="8px">
        <path fill="currentColor" d="M342.6 150.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L192 210.7 86.6 105.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3L146.7 256 41.4 361.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0L192 301.3 297.4 406.6c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L237.3 256 342.6 150.6z"/>
    </svg>`,
            PLUS: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 400" width="15px" height="15px"> 
        <path fill="currentColor" d="M256 80c0-17.7-14.3-32-32-32s-32 14.3-32 32l0 144L48 224c-17.7 0-32 14.3-32 32s14.3 32 32 32l144 0 0 144c0 17.7 14.3 32 32 32s32-14.3 32-32l0-144 144 0c17.7 0 32-14.3 32-32s-14.3-32-32-32l-144 0 0-144z"/>
    </svg>`,
            MINUS: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 400" width="15px" height="15px"> 
        <path fill="currentColor" d="M432 256c0 17.7-14.3 32-32 32L48 288c-17.7 0-32-14.3-32-32s14.3-32 32-32l352 0c17.7 0 32 14.3 32 32z"/>
    </svg>`,
            CALCULATOR: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512" width="24px" height="24px">
        <path fill="currentColor" d="M64 0C28.7 0 0 28.7 0 64L0 448c0 35.3 28.7 64 64 64l256 0c35.3 0 64-28.7 64-64l0-384c0-35.3-28.7-64-64-64L64 0zM96 64l192 0c17.7 0 32 14.3 32 32l0 32c0 17.7-14.3 32-32 32L96 160c-17.7 0-32-14.3-32-32l0-32c0-17.7 14.3-32 32-32zm32 160a32 32 0 1 1 -64 0 32 32 0 1 1 64 0zM96 352a32 32 0 1 1 0-64 32 32 0 1 1 0 64zM64 416c0-17.7 14.3-32 32-32l96 0c17.7 0 32 14.3 32 32s-14.3 32-32 32l-96 0c-17.7 0-32-14.3-32-32zM192 256a32 32 0 1 1 0-64 32 32 0 1 1 0 64zm32 64a32 32 0 1 1 -64 0 32 32 0 1 1 64 0zm64-64a32 32 0 1 1 0-64 32 32 0 1 1 0 64zm32 64a32 32 0 1 1 -64 0 32 32 0 1 1 64 0zM288 448a32 32 0 1 1 0-64 32 32 0 1 1 0 64z"/>
    </svg>`,
            CALENDAR: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" width="24px" height="24px">
        <path fill="currentColor" d="M128 0c17.7 0 32 14.3 32 32l0 32 128 0 0-32c0-17.7 14.3-32 32-32s32 14.3 32 32l0 32 48 0c26.5 0 48 21.5 48 48l0 48H0l0-48c0-26.5 21.5-48 48-48l48 0 0-32c0-17.7 14.3-32 32-32zM0 192l448 0 0 272c0 26.5-21.5 48-48 48L48 512c-26.5 0-48-21.5-48-48L0 192zm64 80l0 32c0 8.8 7.2 16 16 16l32 0c8.8 0 16-7.2 16-16l0-32c0-8.8-7.2-16-16-16l-32 0c-8.8 0-16 7.2-16 16zm128 0l0 32c0 8.8 7.2 16 16 16l32 0c8.8 0 16-7.2 16-16l0-32c0-8.8-7.2-16-16-16l-32 0c-8.8 0-16 7.2-16 16zm144-16c-8.8 0-16 7.2-16 16l0 32c0 8.8 7.2 16 16 16l32 0c8.8 0 16-7.2 16-16l0-32c0-8.8-7.2-16-16-16l-32 0zM64 400l0 32c0 8.8 7.2 16 16 16l32 0c8.8 0 16-7.2 16-16l0-32c0-8.8-7.2-16-16-16l-32 0zm144-16c-8.8 0-16 7.2-16 16l0 32c0 8.8 7.2 16 16 16l32 0c8.8 0 16-7.2 16-16l0-32c0-8.8-7.2-16-16-16l-32 0zm112 16l0 32c0 8.8 7.2 16 16 16l32 0c8.8 0 16-7.2 16-16l0-32c0-8.8-7.2-16-16-16l-32 0c-8.8 0-16 7.2-16 16z"/>
    </svg>`,
            RESCHEDULE: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="24px" height="24px">
        <path fill="currentColor" d="M105.1 202.6c7.7-21.8 20.2-42.3 37.8-59.8c62.5-62.5 163.8-62.5 226.3 0L386.3 160H336c-17.7 0-32 14.3-32 32s14.3 32 32 32H463.5c0 0 0 0 0 0h.4c17.7 0 32-14.3 32-32V64c0-17.7-14.3-32-32-32s-32 14.3-32 32v51.2L414.4 97.6c-87.5-87.5-229.3-87.5-316.8 0C73.2 122 55.6 150.7 44.8 181.4c-5.9 16.7 2.9 34.9 19.5 40.8s34.9-2.9 40.8-19.5zM39 289.3c-5 1.5-9.8 4.2-13.7 8.2c-4 4-6.7 8.8-8.1 14c-.3 1.2-.6 2.5-.8 3.8c-.3 1.7-.4 3.4-.4 5.1V448c0 17.7 14.3 32 32 32s32-14.3 32-32V396.9l17.6 17.5 0 0c87.5 87.4 229.3 87.4 316.7 0c24.4-24.4 42.1-53.1 52.9-83.7c5.9-16.7-2.9-34.9-19.5-40.8s-34.9 2.9-40.8 19.5c-7.7 21.8-20.2 42.3-37.8 59.8c-62.5 62.5-163.8 62.5-226.3 0l-17.6-17.5H176c17.7 0 32-14.3 32-32s-14.3-32-32-32H48.4c-2.2 0-4.2 .5-6.1 1.3z"/>
    </svg>`,
            APPOINTMENT: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512" width="24px" height="24px">
        <path fill="currentColor" d="M14 2.2C22.5-1.7 32.5-.3 39.6 5.8L80 40.4 120.4 5.8c9-7.7 22.3-7.7 31.2 0L192 40.4 232.4 5.8c9-7.7 22.3-7.7 31.2 0L304 40.4 344.4 5.8c7.1-6.1 17.1-7.5 25.6-3.6s14 12.4 14 21.8V488c0 9.4-5.5 17.9-14 21.8s-18.5 2.5-25.6-3.6L304 471.6 263.6 506.2c-9 7.7-22.3 7.7-31.2 0L192 471.6 151.6 506.2c-9 7.7-22.3 7.7-31.2 0L80 471.6 39.6 506.2c-7.1 6.1-17.1 7.5-25.6 3.6S0 497.4 0 488V24C0 14.6 5.5 6.1 14 2.2zM96 144c-8.8 0-16 7.2-16 16s7.2 16 16 16H288c8.8 0 16-7.2 16-16s-7.2-16-16-16H96zM80 208c0-8.8 7.2-16 16-16H288c8.8 0 16 7.2 16 16s-7.2 16-16 16H96c-8.8 0-16-7.2-16-16zM96 304c-8.8 0-16 7.2-16 16s7.2 16 16 16H288c8.8 0 16-7.2 16-16s-7.2-16-16-16H96z"/>
    </svg>`,
            SERVICE: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512" width="24px" height="24px">
        <path fill="currentColor" d="M142.4 21.9c5.6 16.8-3.5 34.9-20.2 40.5L96 71.1V192c0 53 43 96 96 96s96-43 96-96V71.1l-26.1-8.7c-16.8-5.6-25.8-23.7-20.2-40.5s23.7-25.8 40.5-20.2L309.5 18c7.9 2.6 13.3 9.7 13.9 18.3s-4.6 16.6-12.1 20.2L288 71.1V192c0 70.7-57.3 128-128 128s-128-57.3-128-128V71.1L8.7 56.5C-2.9 53-9.2 40.8-5.7 29.1S18.4.7 30.1 4.2L57.4 12.8C65.3 15.4 70.7 22.5 71.3 31.1s-4.6 16.6-12.1 20.2L32 71.1V192c0 70.7 57.3 128 128 128v64c0 17.7-14.3 32-32 32H96c-17.7 0-32 14.3-32 32s14.3 32 32 32H480c17.7 0 32-14.3 32-32s-14.3-32-32-32H192c-17.7 0-32-14.3-32-32V320c70.7 0 128-57.3 128-128V71.1l-26.1 8.7c-7.5 2.5-11.7 10.5-11.1 18.9.6 8.4 6 15.9 13.9 18.5l27.3 9.1c11.7 3.9 18 16.7 14.1 28.4s-16.7 18-28.4 14.1L250.5 160c-7.9-2.6-13.3-9.7-13.9-18.3s4.6-16.6 12.1-20.2L288 96V71.1l-26.1-8.7c-16.8-5.6-25.8-23.7-20.2-40.5s23.7-25.8 40.5-20.2L309.5 18c7.9 2.6 13.3 9.7 13.9 18.3s-4.6 16.6-12.1 20.2L288 71.1"/>
    </svg>`
        };
        // Initialize global click handler
        this.initGlobalClickHandler();
    }
    // ============================================================================
    // NEW: Set CreatForm instance and initialize processors
    // ============================================================================
    setCreatFormInstance(creatFormInstance) {
        this.creatFormInstance = creatFormInstance;
        this.dataProcessor = new FormDataProcessor(creatFormInstance);
        this.formatter = new FieldValueFormatter(creatFormInstance);
    }
    // ===== GLOBAL CLICK MANAGEMENT =====
    initGlobalClickHandler() {
        if (!this.globalClickHandlerAttached) {
            this.globalClickHandler = this.handleGlobalClick.bind(this);
            document.addEventListener('click', this.globalClickHandler, true);
            this.globalClickHandlerAttached = true;
        }
    }
    handleGlobalClick(event) {
        // Close all open dropdowns that don't contain the clicked element
        this.openDropdowns.forEach(dropdown => {
            if (!dropdown.element.contains(event.target)) {
                dropdown.close();
            }
        });
        // Close all open info panels that don't contain the clicked element
        this.openInfoPanels.forEach(infoPanel => {
            if (!infoPanel.element.contains(event.target) &&
                !infoPanel.button.contains(event.target)) {
                infoPanel.close();
            }
        });
    }
    registerDropdown(dropdownInstance) {
        this.openDropdowns.add(dropdownInstance);
    }
    unregisterDropdown(dropdownInstance) {
        this.openDropdowns.delete(dropdownInstance);
    }
    registerInfoPanel(infoPanelInstance) {
        this.openInfoPanels.add(infoPanelInstance);
    }
    unregisterInfoPanel(infoPanelInstance) {
        this.openInfoPanels.delete(infoPanelInstance);
    }
    closeAllDropdowns() {
        this.openDropdowns.forEach(dropdown => dropdown.close());
    }
    closeAllInfoPanels() {
        this.openInfoPanels.forEach(infoPanel => infoPanel.close());
    }
    // ===== FIELD REGISTRATION METHOD =====
    /**
     * Register a custom field type with the factory
     * @param {string} fieldType - The field type identifier
     * @param {Function} fieldClass - The field class constructor
     */
    registerField(fieldType, fieldClass) {
        if (!this.fieldRegistry) {
            this.fieldRegistry = {};
        }
        
        if (!fieldType || !fieldClass) {
            console.error('FormFieldFactory.registerField: Both fieldType and fieldClass are required');
            return;
        }
        
        // Store the field class in the registry
        this.fieldRegistry[fieldType] = fieldClass;
        
        console.log(`FormFieldFactory: Registered custom field type '${fieldType}'`);
    }
    // ===== FIELD CREATION METHOD =====
    createField(config) {
        let field;
        
        // Check if this is a registered custom field type
        if (this.fieldRegistry && this.fieldRegistry[config.type]) {
            const FieldClass = this.fieldRegistry[config.type];
            field = new FieldClass(this, config);
            return field;
        }
        
        // Continue with the existing switch statement
        switch (config.type) {
        case 'text':
            field = new TextField(this, config);
            break;
        case 'email':
            field = new EmailField(this, config);
            break;
        case 'phone':
            field = new PhoneField(this, config);
            break;
        case 'url':
            field = new UrlField(this, config);
            break;
        case 'textarea':
            field = new TextAreaField(this, config);
            break;
        case 'number':
            field = new NumberField(this, config);
            break;
        case 'percentage':
            field = new PercentageField(this, config);
            break;
        case 'options-stepper':
            field = new OptionsStepperField(this, config);
            break;
        case 'yesno':
            field = new YesNoField(this, config);
            break;
        case 'select':
            field = new SingleSelectField(this, config);
            break;
        case 'multiselect':
            field = new MultiSelectField(this, config);
            break;
        case 'select-subsections':
            field = new SingleSelectSubsectionsField(this, config);
            break;
        case 'multiselect-subsections':
            field = new MultiSelectSubsectionsField(this, config);
            break;
        case 'yesno-with-options':
            field = new YesNoWithOptionsField(this, config);
            break;
        case 'select-with-other':
            field = new SingleSelectWithOtherField(this, config);
            break;
        case 'multiselect-with-other':
            field = new MultiSelectWithOtherField(this, config);
            break;
        case 'sliding-window-range':
            field = new SlidingWindowRangeField(this, config);
            break;
        case 'sliding-window':
            field = new SlidingWindowSliderField(this, config);
            break;
        case 'dual-range':
            field = new DualRangeField(this, config);
            break;
        case 'slider':
            field = new SliderField(this, config);
            break;
        case 'options-slider':
            field = new OptionsSliderField(this, config);
            break;
        case 'serviceCard':
            field = new ServiceCardField(this, config);
            break;
        case 'carousel':
            field = new CarouselField(this, config);
            break;
        case 'filteredCarousel':
            field = new FilteredCarouselField(this, config);
            break;
        case 'service-provider-calendar':
            field = new ServiceProviderCalendarField(this, config);
            break;
        case 'calendar':
            field = new CalendarField(this, config);
            break;
        case 'item-calendar':
            field = new ItemCalendarField(this, config);
            break;
        case 'category-item-filter':
            field = new CategoryItemFilterField(this, config);
            break;
        case 'tab-manager':
            field = new TabManager(this, config);
            break;
        case 'category-item-calendar':
            field = new CategoryAndItemCalendarField(this, config);
            break;
        case 'image-gallery':
            field = new ImageGalleryField(this, config);
            break;
        case 'service-request-calendar':
        case 'serviceRequestCalendar':
            field = new ServiceRequestCalendarField(this, config);
            break;
        case 'terms-checkbox':
        case 'termsCheckbox':
            field = new TermsCheckboxField(this, config);
            break;
        case 'category-request-file-upload':
        case 'categoryRequestFileUpload':
            field = new CategoryRequestFileUploadField(this, config);
            break;
        case 'currentAppointmentCard':
            field = new CurrentAppointmentCardField(this, config);
            break;
        case 'custom':
            field = new CustomField(this, config); // Uses CustomField extending BaseField
            break;
        case 'booking-cancellation-card':
            field = new BookingCancellationCardField(this, config);
            break;
        default:
            console.warn(`Unknown field type: ${config.type}`);
            field = new TextField(this, config);
        }
        return field;
    }
    // ============================================================================
    // UPDATED: Simplified data processing using FormDataProcessor
    // ============================================================================
    /**
     * NEW: Simplified form data processor using FormDataProcessor (same as transformers)
     * @param {Object} rawFormData - Raw data from any multi-step form
     * @returns {Object} Processed data ready for submission
     */
    processFormData(rawFormData) {
        if (!this.dataProcessor) {
            console.warn('FormDataProcessor not available - CreatForm instance not set');
            return this.fallbackProcessing(rawFormData);
        }
        try {
            // Use the same FormDataProcessor as transformers
            return this.dataProcessor.processFormData(rawFormData);
        } catch (error) {
            console.error('Error processing form data:', error);
            return this.fallbackProcessing(rawFormData);
        }
    }
    /**
     * NEW: Fallback processing for when FormDataProcessor is not available
     */
    fallbackProcessing(rawFormData) {
        const processed = {};
        Object.keys(rawFormData)
            .forEach(fieldName => {
                const fieldValue = rawFormData[fieldName];
                // Basic processing without field configuration
                processed[fieldName] = {
                    fieldId: fieldName,
                    fieldType: 'unknown',
                    label: fieldName,
                    displayValue: this.basicValueFormat(fieldValue),
                    rawValue: fieldValue
                };
            });
        return processed;
    }
    /**
     * Basic value formatting when FieldValueFormatter is not available
     */
    basicValueFormat(value) {
        if (value === undefined || value === null || value === '') {
            return '';
        }
        if (Array.isArray(value)) {
            return value.join(', ');
        }
        if (typeof value === 'object') {
            // Handle yesno-with-options structure
            if (value.main !== undefined) {
                return value.main === true || value.main === 'yes' ? 'Yes' : 'No';
            }
            // Handle select-with-other structure
            if (value.main && value.other) {
                return value.main === 'other' ? value.other : value.main;
            }
            return JSON.stringify(value);
        }
        return value.toString();
    }
    // ============================================================================
    // UPDATED: Get field configurations using same approach as FormDataProcessor
    // ============================================================================
    /**
     * Get field configurations from current multi-step form
     */
    getFieldConfigurations() {
        if (!this.currentMultiStepForm || !this.currentMultiStepForm.steps) {
            return [];
        }
        const configs = [];
        this.currentMultiStepForm.steps.forEach(step => {
            if (step.fields) {
                configs.push(...this.extractFieldConfigs(step.fields));
            }
        });
        return configs;
    }
    /**
     * Extract field configurations including nested fields (same as FormDataProcessor)
     */
    extractFieldConfigs(fields) {
        const configs = [];
        fields.forEach(fieldConfig => {
            configs.push(fieldConfig);
            // Extract nested field configurations
            if (fieldConfig.yesFields) {
                configs.push(...this.extractFieldConfigs(fieldConfig.yesFields));
            }
            if (fieldConfig.yesField) {
                configs.push(fieldConfig.yesField);
            }
            if (fieldConfig.noFields) {
                configs.push(...this.extractFieldConfigs(fieldConfig.noFields));
            }
            if (fieldConfig.noField) {
                configs.push(fieldConfig.noField);
            }
        });
        return configs;
    }
    /**
     * Find field configuration by name (same as FormDataProcessor)
     */
    findFieldConfiguration(fieldName, fieldConfigurations) {
        return fieldConfigurations.find(config =>
            (config.name === fieldName) ||
            (config.id === fieldName)
        ) || null;
    }
    // ============================================================================
    // REMOVED: All old flatData methods (universalFlatten, universalConvertIds, etc.)
    // These are no longer needed with the new FormDataProcessor approach
    // ============================================================================
    // ===== STANDARD METHODS =====
    getText(key, customMessages = {}) {
        return customMessages[key] || this.texts[key] || key;
    }
    createYesNoField(config) {
        return new YesNoField(this, config);
    }
    createTextField(config) {
        return new TextField(this, config);
    }
    createTextAreaField(config) {
        return new TextAreaField(this, config);
    }
    createEmailField(config) {
        return new EmailField(this, config);
    }
    createPhoneField(config) {
        return new PhoneField(this, config);
    }
    createUrlField(config) {
        return new UrlField(this, config);
    }
    createNumberField(config) {
        return new NumberField(this, config);
    }
    createPercentageField(config) {
        return new PercentageField(this, config);
    }
    createOptionsStepperField(config) {
        return new OptionsStepperField(this, config);
    }
    createSingleSelectField(config) {
        return new SingleSelectField(this, config);
    }
    createMultiSelectField(config) {
        return new MultiSelectField(this, config);
    }
    createSingleSelectSubsectionsField(config) {
        return new SingleSelectSubsectionsField(this, config);
    }
    createMultiSelectSubsectionsField(config) {
        return new MultiSelectSubsectionsField(this, config);
    }
    createYesNoWithOptionsField(config) {
        return new YesNoWithOptionsField(this, config);
    }
    createSingleSelectWithOtherField(config) {
        return new SingleSelectWithOtherField(this, config);
    }
    createMultiSelectWithOtherField(config) {
        return new MultiSelectWithOtherField(this, config);
    }
    createMultiStepForm(config) {
        return new MultiStepForm(this, config);
    }
    createSlidingWindowRangeField(config) {
        return new SlidingWindowRangeField(this, config);
    }
    createDualRangeField(config) {
        return new DualRangeField(this, config);
    }
    createSliderField(config) {
        return new SliderField(this, config);
    }
    createOptionsSliderField(config) {
        return new OptionsSliderField(this, config);
    }
    createSlidingWindowSliderField(config) {
        return new SlidingWindowSliderField(this, config);
    }
    createServiceCardField(config) {
        return new ServiceCardField(this, config);
    }
    createCarouselField(config) {
        return new CarouselField(this, config);
    }
    createFilteredCarouselField(config) {
        return new FilteredCarouselField(this, config);
    }
    createServiceProviderCalendarField(config) {
        return new ServiceProviderCalendarField(this, config);
    }
    createCalendarField(config) {
        return new CalendarField(this, config);
    }
    createItemCalendarField(config) {
        return new ItemCalendarField(this, config);
    }
    createImageGalleryField(config) {
        return new ImageGalleryField(this, config);
    }
    createTabManager(config) {
        return new TabManager(this, config);
    }
    createBookingCancellationCardField(config) {
        return new BookingCancellationCardField(this, config);
    }
    createCategoryAndItemCalendarField(config) {
        return new CategoryAndItemCalendarField(this, config);
    }
    createCategoryItemFilterField(config) {
        return new CategoryItemFilterField(this, config);
    }
    // ===== NEW CUSTOM FIELD FACTORY METHODS =====
    createServiceRequestCalendarField(config) {
        return new ServiceRequestCalendarField(this, config);
    }
    createTermsCheckboxField(config) {
        return new TermsCheckboxField(this, config);
    }
    createCategoryRequestFileUploadField(config) {
        return new CategoryRequestFileUploadField(this, config);
    }
    createCurrentAppointmentCardField(config) {
        return new CurrentAppointmentCardField(this, config);
    }
    // ============================================================================
    // NEW: Public API for accessing processors
    // ============================================================================
    /**
     * Get the FormDataProcessor instance
     */
    getDataProcessor() {
        return this.dataProcessor;
    }
    /**
     * Get the FieldValueFormatter instance
     */
    getFormatter() {
        return this.formatter;
    }
    /**
     * Format a field value using the same approach as transformers
     */
    formatFieldValue(fieldConfig, value, context = {}) {
        if (this.formatter) {
            return this.formatter.formatValue(fieldConfig, value, context);
        }
        return this.basicValueFormat(value);
    }
    /**
     * Process form data the same way as transformers
     */
    processDataLikeTransformers(formData) {
        if (this.dataProcessor) {
            return this.dataProcessor.processFormData(formData);
        }
        return this.fallbackProcessing(formData);
    }
    // Cleanup method
    destroy() {
        if (this.globalClickHandlerAttached) {
            document.removeEventListener('click', this.globalClickHandler, true);
            this.globalClickHandlerAttached = false;
        }
        this.openDropdowns.clear();
        this.openInfoPanels.clear();
        // Clean up processor references
        this.dataProcessor = null;
        this.formatter = null;
        this.creatFormInstance = null;
    }
    static ValidationUtils = {
        isValidEmail(email) {
            const emailPattern = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i;
            return emailPattern.test(email);
        },
        isValidPhoneNumber(phoneNumber) {
            const phonePattern = /^(\(\d{3}\)|\d{3})[- ]?\d{3}[- ]?\d{4}$/;
            return phonePattern.test(phoneNumber);
        },
        isValidUrl(url) {
            if (!url || url.trim() === '') return false;
            let testUrl = url.trim();
            if (!testUrl.match(/^https?:\/\//)) {
                testUrl = 'https://' + testUrl;
            }
            try {
                new URL(testUrl);
                const urlPattern = /^(https?:\/\/)?(www\.)?[a-zA-Z0-9-]+(\.[a-zA-Z0-9-]+)*\.[a-zA-Z]{2,}(\/[a-zA-Z0-9-._~:/?#[\]@!$&'()*+,;=%]*)?$/;
                return urlPattern.test(url.trim());
            } catch (e) {
                return false;
            }
        },
        formatPhoneNumber(phoneNumber) {
            const cleaned = phoneNumber.replace(/\D/g, '');
            if (cleaned.length === 10) {
                return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
            }
            return phoneNumber;
        },
        normalizeUrl(url) {
            if (!url || url.trim() === '') return '';
            let normalized = url.trim();
            if (!normalized.match(/^https?:\/\//)) {
                if (normalized.startsWith('www.') || normalized.split('.')
                    .length > 2) {
                    normalized = 'https://' + normalized;
                } else {
                    normalized = 'https://www.' + normalized;
                }
            }
            return normalized;
        }
    };
}
/**
 * MultiStepForm - Enhanced main manager for multi-step forms
 */
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
        if (currentStep === totalSteps - 1) {
            this.nextButton.style.display = 'none';
            this.submitButton.style.display = 'inline-block';
        } else {
            this.nextButton.style.display = 'inline-block';
            this.submitButton.style.display = 'none';
        }
    }
}
/**
 * BaseField - Enhanced base class for all fields with personalized error messages
 */
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
/**
 * YesNoField - Generalized Yes/No field with custom options support
 */
class YesNoField extends BaseField {
    constructor(factory, config) {
        super(factory, config);
        // Support for custom options
        this.customOptions = config.customOptions || null;
        // If customOptions provided, use them, otherwise default to yes/no
        if (this.customOptions && Array.isArray(this.customOptions) && this.customOptions.length === 2) {
            this.yesOption = this.customOptions[0];
            this.noOption = this.customOptions[1];
        } else {
            this.yesOption = {
                value: 'yes',
                label: factory.getText('yes')
            };
            this.noOption = {
                value: 'no',
                label: factory.getText('no')
            };
        }
    }
    render() {
        const container = this.createContainer();
        const labelContainer = this.createQuestionLabel();
        const optionsGroup = document.createElement('div');
        optionsGroup.className = 'options-group';
        const yesOption = document.createElement('label');
        yesOption.className = 'radio-option';
        yesOption.innerHTML = `
            <input type="radio" name="${this.name}" value="${this.yesOption.value}" />
            <span class="radio-icon"></span>
            <span class="radio-label">${this.yesOption.label}</span>
        `;
        const noOption = document.createElement('label');
        noOption.className = 'radio-option';
        noOption.innerHTML = `
            <input type="radio" name="${this.name}" value="${this.noOption.value}" />
            <span class="radio-icon"></span>
            <span class="radio-label">${this.noOption.label}</span>
        `;
        optionsGroup.appendChild(yesOption);
        optionsGroup.appendChild(noOption);
        const errorElement = this.createErrorElement();
        container.appendChild(labelContainer);
        container.appendChild(optionsGroup);
        container.appendChild(errorElement);
        const radioInputs = container.querySelectorAll('input[type="radio"]');
        radioInputs.forEach(radio => {
            radio.addEventListener('change', () => {
                this.value = radio.value;
                this.hideError();
                this.handleChange();
            });
        });
        this.container = container;
        return container;
    }
    validate() {
        if (this.required && !this.getValue()) {
            this.showError(this.getFieldErrorMessage('required'));
            return false;
        }
        return super.validate();
    }
    getValue() {
        if (this.container) {
            const checkedRadio = this.container.querySelector('input[type="radio"]:checked');
            return checkedRadio ? checkedRadio.value : '';
        }
        return this.value;
    }
    setValue(value) {
        this.value = value;
        if (this.container) {
            const radio = this.container.querySelector(`input[value="${value}"]`);
            if (radio) radio.checked = true;
        }
    }
    // Get display value for the current selection
    getDisplayValue() {
        const currentValue = this.getValue();
        if (currentValue === this.yesOption.value) {
            return this.yesOption.label;
        } else if (currentValue === this.noOption.value) {
            return this.noOption.label;
        }
        return currentValue;
    }
}
/**
 * Enhanced NumberField with support for linked constraints and personalized error messages
 */
class NumberField extends BaseField {
    constructor(factory, config) {
        super(factory, config);
        this.min = config.min || 0;
        this.max = config.max || 1000000;
        this.step = config.step || 1;
        this.prefix = config.prefix || '';
        this.suffix = config.suffix || '';
        this.customValidation = config.customValidation || null;
        this.linkedField = config.linkedField || null;
        this.value = config.value || config.defaultValue || 0;
        this.errorElement = null;
    }
    validateValue(newValue) {
        // First, check min/max constraints
        if (newValue < this.min) {
            this.showError(`Value must be at least ${this.min}`);
            return this.min;
        }
        if (newValue > this.max) {
            this.showError(`Value must be at most ${this.max}`);
            return this.max;
        }
        // Then run custom validation if provided
        if (this.customValidation) {
            const validationResult = this.customValidation(newValue, this.factory.formValues);
            if (validationResult !== true) {
                if (typeof validationResult === 'object') {
                    this.showError(validationResult.message);
                    return validationResult.adjustedValue !== undefined ? validationResult.adjustedValue : this.value;
                } else if (typeof validationResult === 'string') {
                    this.showError(validationResult);
                    return this.value;
                }
                return this.value;
            }
        }
        this.hideError();
        return newValue;
    }
    validate() {
        if (this.required && (this.value === null || this.value === undefined || this.value === '')) {
            this.showError(this.getFieldErrorMessage('required'));
            return false;
        }
        // Validate min/max for required validation
        if (this.value < this.min) {
            this.showError(this.getFieldErrorMessage('min') || `Value must be at least ${this.min}`);
            return false;
        }
        if (this.value > this.max) {
            this.showError(this.getFieldErrorMessage('max') || `Value must be at most ${this.max}`);
            return false;
        }
        return super.validate();
    }
    render() {
        this.container = document.createElement('div');
        this.container.className = 'form-group';
        const label = this.createLabel();
        this.container.appendChild(label);
        const inputGroup = document.createElement('div');
        inputGroup.className = 'input-group';
        const decrementBtn = document.createElement('button');
        decrementBtn.type = 'button';
        decrementBtn.className = 'decrement-btn';
        decrementBtn.innerHTML = this.factory.SVG_ICONS.MINUS;
        this.element = document.createElement('input');
        this.element.type = 'number';
        this.element.id = this.id;
        this.element.value = this.formatValue(this.value);
        // ✅ FIX: Set min, max, and step attributes on the HTML element
        this.element.min = this.min;
        this.element.max = this.max;
        this.element.step = this.step;
        const incrementBtn = document.createElement('button');
        incrementBtn.type = 'button';
        incrementBtn.className = 'increment-btn';
        incrementBtn.innerHTML = this.factory.SVG_ICONS.PLUS;
        inputGroup.appendChild(decrementBtn);
        inputGroup.appendChild(this.element);
        inputGroup.appendChild(incrementBtn);
        this.container.appendChild(inputGroup);
        // Add error element
        const errorEl = this.createErrorElement();
        this.container.appendChild(errorEl);
        // Event listeners
        this.element.addEventListener('input', () => {
            const newValue = this.parseValue(this.element.value);
            // ✅ FIX: Clamp value to min/max range before validation
            const clampedValue = Math.min(Math.max(newValue, this.min), this.max);
            const validatedValue = this.validateValue(clampedValue);
            this.value = validatedValue;
            this.element.value = this.formatValue(this.value);
            this.handleChange();
        });
        // ✅ FIX: Add blur event to handle cases where user types invalid values
        this.element.addEventListener('blur', () => {
            const newValue = this.parseValue(this.element.value);
            const clampedValue = Math.min(Math.max(newValue, this.min), this.max);
            const validatedValue = this.validateValue(clampedValue);
            this.value = validatedValue;
            this.element.value = this.formatValue(this.value);
        });
        decrementBtn.addEventListener('click', () => {
            const newValue = Math.max(this.min, this.value - this.step);
            const validatedValue = this.validateValue(newValue);
            this.value = validatedValue;
            this.element.value = this.formatValue(this.value);
            this.handleChange();
        });
        incrementBtn.addEventListener('click', () => {
            const newValue = Math.min(this.max, this.value + this.step);
            const validatedValue = this.validateValue(newValue);
            this.value = validatedValue;
            this.element.value = this.formatValue(this.value);
            this.handleChange();
        });
        return this.container;
    }
    formatValue(value) {
        return value.toString();
    }
    parseValue(value) {
        const parsed = parseFloat((value || '')
            .toString()
            .replace(/\s/g, '')) || 0;
        // ✅ FIX: Return a valid number, defaulting to min if invalid
        return isNaN(parsed) ? this.min : parsed;
    }
    getValue() {
        return this.value;
    }
    setValue(value) {
        const newValue = this.parseValue(value);
        // ✅ FIX: Clamp the value when setting it
        this.value = Math.min(Math.max(newValue, this.min), this.max);
        if (this.element) {
            this.element.value = this.formatValue(this.value);
        }
    }
    // Method to trigger validation from external sources
    revalidate() {
        const clampedValue = Math.min(Math.max(this.value, this.min), this.max);
        const validatedValue = this.validateValue(clampedValue);
        if (validatedValue !== this.value) {
            this.value = validatedValue;
            this.element.value = this.formatValue(this.value);
            this.handleChange();
        }
    }
}
class PercentageField extends NumberField {
    constructor(factory, config) {
        super(factory, config);
        this.min = config.min || 0;
        this.max = config.max || 20;
        this.step = config.step || 0.05;
        this.decimalPlaces = config.decimalPlaces || 2;
    }
    formatValue(value) {
        return parseFloat(value)
            .toFixed(this.decimalPlaces);
    }
    parseValue(value) {
        return parseFloat(value) || 0;
    }
}
class OptionsStepperField extends BaseField {
    constructor(factory, config) {
        super(factory, config);
        this.options = config.options || [];
        this.currentIndex = config.defaultIndex || 0;
        this.displayFormatter = config.displayFormatter || null;
        this.fieldStyle = config.fieldStyle || 'default';
        this.value = this.getCurrentValue();
    }
    getCurrentValue() {
        const option = this.options[this.currentIndex];
        return typeof option === 'object' ? option.value : option;
    }
    validate() {
        if (this.required && (this.value === undefined || this.value === null || this.value === '')) {
            this.showError(this.getFieldErrorMessage('required'));
            return false;
        }
        return super.validate();
    }
    render() {
        this.container = document.createElement('div');
        this.container.className = 'form-group';
        if (this.fieldStyle === 'stepper') {
            this.container.classList.add('stepper-field');
        }
        const label = this.createLabel();
        this.container.appendChild(label);
        const inputGroup = document.createElement('div');
        inputGroup.className = 'input-group';
        const decrementBtn = document.createElement('button');
        decrementBtn.type = 'button';
        decrementBtn.className = 'decrement-btn';
        decrementBtn.innerHTML = this.factory.SVG_ICONS.MINUS;
        this.element = document.createElement('input');
        this.element.type = 'text';
        this.element.id = this.id;
        this.element.className = 'stepper-display-input';
        this.element.readOnly = true;
        this.element.value = this.getDisplayText();
        const incrementBtn = document.createElement('button');
        incrementBtn.type = 'button';
        incrementBtn.className = 'increment-btn';
        incrementBtn.innerHTML = this.factory.SVG_ICONS.PLUS;
        inputGroup.appendChild(decrementBtn);
        inputGroup.appendChild(this.element);
        inputGroup.appendChild(incrementBtn);
        this.container.appendChild(inputGroup);
        // Update initial value
        this.updateValue();
        // Event listeners
        decrementBtn.addEventListener('click', () => {
            if (this.currentIndex > 0) {
                this.currentIndex--;
                this.updateValue();
                this.updateDisplay();
                this.handleChange();
            }
        });
        incrementBtn.addEventListener('click', () => {
            if (this.currentIndex < this.options.length - 1) {
                this.currentIndex++;
                this.updateValue();
                this.updateDisplay();
                this.handleChange();
            }
        });
        return this.container;
    }
    updateValue() {
        const option = this.options[this.currentIndex];
        this.value = typeof option === 'object' ? option.value : option;
    }
    updateDisplay() {
        this.element.value = this.getDisplayText();
    }
    getDisplayText() {
        const option = this.options[this.currentIndex];
        if (this.displayFormatter) {
            return this.displayFormatter(option);
        }
        return typeof option === 'object' ? option.display || option.label || option.value : option;
    }
    getValue() {
        return this.value;
    }
    setValue(value) {
        const index = this.options.findIndex(opt =>
            (typeof opt === 'object' ? opt.value : opt) === value
        );
        if (index !== -1) {
            this.currentIndex = index;
            this.updateValue();
            this.updateDisplay();
        }
    }
}
/**
 * TextField - Simple text field with personalized error messages
 */
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
/**
 * YesNoWithOptionsField - Enhanced with generalized option support
 */
class YesNoWithOptionsField extends BaseField {
    constructor(factory, config) {
        super(factory, config);
        // FIXED: Ensure factory is properly stored for text access
        this.factory = factory;
        this.yesFieldConfig = config.yesField || null;
        this.noFieldConfig = config.noField || null;
        this.yesFieldsConfig = config.yesFields || (config.yesField ? [config.yesField] : []);
        this.noFieldsConfig = config.noFields || (config.noField ? [config.noField] : []);
        this.layout = config.layout || 'below';
        this.customOptions = config.customOptions || null;
        // Set up option values and labels
        if (this.customOptions && Array.isArray(this.customOptions) && this.customOptions.length === 2) {
            this.yesOption = this.customOptions[0];
            this.noOption = this.customOptions[1];
        } else {
            this.yesOption = {
                value: 'yes',
                label: this.getText('yes')
            };
            this.noOption = {
                value: 'no',
                label: this.getText('no')
            };
        }
        this.yesFieldInstances = [];
        this.noFieldInstances = [];
    }
    // FIXED: Add a helper method to safely get text
    getText(key) {
        return this.factory.getText ? this.factory.getText(key) :
            this.factory.texts ? this.factory.texts[key] : key;
    }
    validate() {
        if (this.required && !this.getValue()
            .main) {
            this.showError(this.getFieldErrorMessage('required'));
            return false;
        }
        let isValid = true;
        const currentValue = this.getValue();
        if (currentValue.main === this.yesOption.value &&
            this.yesContainer && this.yesContainer.style.display === 'block') {
            this.yesFieldInstances.forEach(fieldInstance => {
                if (!fieldInstance.validate()) {
                    isValid = false;
                }
            });
        }
        if (currentValue.main === this.noOption.value &&
            this.noContainer && this.noContainer.style.display === 'block') {
            this.noFieldInstances.forEach(fieldInstance => {
                if (!fieldInstance.validate()) {
                    isValid = false;
                }
            });
        }
        if (isValid) {
            this.hideError();
        }
        return isValid;
    }
    render() {
        const container = this.createContainer();
        const label = this.createQuestionLabel();
        const optionsGroup = document.createElement('div');
        optionsGroup.className = 'options-group';
        const yesOption = document.createElement('label');
        yesOption.className = 'radio-option';
        yesOption.innerHTML = `
            <input type="radio" name="${this.name}" value="${this.yesOption.value}" />
            <span class="radio-icon"></span>
            <span class="radio-label">${this.yesOption.label}</span>
        `;
        const noOption = document.createElement('label');
        noOption.className = 'radio-option';
        noOption.innerHTML = `
            <input type="radio" name="${this.name}" value="${this.noOption.value}" />
            <span class="radio-icon"></span>
            <span class="radio-label">${this.noOption.label}</span>
        `;
        optionsGroup.appendChild(yesOption);
        optionsGroup.appendChild(noOption);
        let conditionalContainer;
        if (this.layout === 'side-by-side' && this.yesFieldsConfig.length > 0 && this.noFieldsConfig.length > 0) {
            conditionalContainer = document.createElement('div');
            conditionalContainer.className = 'conditional-side-by-side';
        } else {
            conditionalContainer = document.createElement('div');
        }
        let yesContainer = null;
        if (this.yesFieldsConfig.length > 0) {
            yesContainer = document.createElement('div');
            yesContainer.className = 'conditional-field-wrapper';
            yesContainer.id = `${this.id}-yes-options`;
            yesContainer.style.display = 'none';
            // Group yesFields by row (same logic as FormStep)
            const yesFieldGroups = this.groupFields(this.yesFieldsConfig);
            yesFieldGroups.forEach(group => {
                if (group.isRow) {
                    // Create row container
                    const rowContainer = document.createElement('div');
                    rowContainer.className = 'field-row';
                    group.fields.forEach((fieldConfig, index) => {
                        const colContainer = document.createElement('div');
                        colContainer.className = 'field-col';
                        const fieldInstance = this.createFieldInstance(fieldConfig, `yes-${this.yesFieldInstances.length}`);
                        if (fieldInstance) {
                            this.yesFieldInstances.push(fieldInstance);
                            colContainer.appendChild(fieldInstance.render());
                        }
                        rowContainer.appendChild(colContainer);
                    });
                    yesContainer.appendChild(rowContainer);
                } else {
                    // Single field
                    const fieldInstance = this.createFieldInstance(group.fields[0], `yes-${this.yesFieldInstances.length}`);
                    if (fieldInstance) {
                        this.yesFieldInstances.push(fieldInstance);
                        const fieldElement = fieldInstance.render();
                        yesContainer.appendChild(fieldElement);
                    }
                }
            });
        }
        let noContainer = null;
        if (this.noFieldsConfig.length > 0) {
            noContainer = document.createElement('div');
            noContainer.className = 'conditional-field-wrapper';
            noContainer.id = `${this.id}-no-options`;
            noContainer.style.display = 'none';
            // Group noFields by row (same logic as FormStep)
            const noFieldGroups = this.groupFields(this.noFieldsConfig);
            noFieldGroups.forEach(group => {
                if (group.isRow) {
                    // Create row container
                    const rowContainer = document.createElement('div');
                    rowContainer.className = 'field-row';
                    group.fields.forEach((fieldConfig, index) => {
                        const colContainer = document.createElement('div');
                        colContainer.className = 'field-col';
                        const fieldInstance = this.createFieldInstance(fieldConfig, `no-${this.noFieldInstances.length}`);
                        if (fieldInstance) {
                            this.noFieldInstances.push(fieldInstance);
                            colContainer.appendChild(fieldInstance.render());
                        }
                        rowContainer.appendChild(colContainer);
                    });
                    noContainer.appendChild(rowContainer);
                } else {
                    // Single field
                    const fieldInstance = this.createFieldInstance(group.fields[0], `no-${this.noFieldInstances.length}`);
                    if (fieldInstance) {
                        this.noFieldInstances.push(fieldInstance);
                        const fieldElement = fieldInstance.render();
                        noContainer.appendChild(fieldElement);
                    }
                }
            });
        }
        if (yesContainer) conditionalContainer.appendChild(yesContainer);
        if (noContainer) conditionalContainer.appendChild(noContainer);
        const errorElement = this.createErrorElement();
        container.appendChild(label);
        container.appendChild(optionsGroup);
        if (yesContainer || noContainer) {
            container.appendChild(conditionalContainer);
        }
        container.appendChild(errorElement);
        const radioInputs = container.querySelectorAll('input[type="radio"]');
        radioInputs.forEach(radio => {
            radio.addEventListener('change', () => {
                this.value = radio.value;
                this.hideError();
                const isYesValue = radio.value === this.yesOption.value;
                const isNoValue = radio.value === this.noOption.value;
                if (isYesValue) {
                    if (yesContainer) yesContainer.style.display = 'block';
                    if (noContainer) noContainer.style.display = 'none';
                } else if (isNoValue) {
                    if (yesContainer) yesContainer.style.display = 'none';
                    if (noContainer) noContainer.style.display = 'block';
                }
                this.handleChange();
            });
        });
        this.container = container;
        this.yesContainer = yesContainer;
        this.noContainer = noContainer;
        return container;
    }
    createFieldInstance(fieldConfig, suffix) {
        const fieldType = fieldConfig.type;
        const config = {
            ...fieldConfig,
            id: `${this.id}-${suffix}-${fieldConfig.id}`,
            name: fieldConfig.name || fieldConfig.id,
            onChange: (value) => {
                if (fieldConfig.onChange) {
                    fieldConfig.onChange(value);
                }
                this.handleChange();
            }
        };
        switch (fieldType) {
        case 'text':
            return this.factory.createTextField(config);
        case 'email':
            return this.factory.createEmailField(config);
        case 'phone':
            return this.factory.createPhoneField(config);
        case 'url':
            return this.factory.createUrlField(config);
        case 'textarea':
            return this.factory.createTextAreaField(config);
        case 'number':
            return this.factory.createNumberField(config);
        case 'percentage':
            return this.factory.createPercentageField(config);
        case 'options-stepper':
            return this.factory.createOptionsStepperField(config);
        case 'yesno':
            return this.factory.createYesNoField(config);
        case 'select':
            return this.factory.createSingleSelectField(config);
        case 'multiselect':
            return this.factory.createMultiSelectField(config);
        case 'select-subsections':
            return this.factory.createSingleSelectSubsectionsField(config);
        case 'multiselect-subsections':
            return this.factory.createMultiSelectSubsectionsField(config);
        case 'yesno-with-options':
            return this.factory.createYesNoWithOptionsField(config);
        case 'select-with-other':
            return this.factory.createSingleSelectWithOtherField(config);
        case 'multiselect-with-other':
            return this.factory.createMultiSelectWithOtherField(config);
        case 'options-slider':
            return this.factory.createOptionsSliderField(config);
        default:
            console.warn(`Unknown field type: ${fieldType}`);
            return null;
        }
    }
    // ENHANCED: getValue method to properly handle unselected states
    getValue() {
        const mainValue = this.container ?
            this.container.querySelector('input[type="radio"]:checked')
            ?.value :
            this.value;
        // If no selection made and field is not required, return null instead of empty string
        if (!mainValue && !this.required) {
            return {
                main: null
            };
        }
        // If no selection made but field is required, return empty string to trigger validation
        if (!mainValue && this.required) {
            return {
                main: ''
            };
        }
        const result = {
            main: mainValue
        };
        if (mainValue === this.yesOption.value && this.yesFieldInstances.length > 0) {
            result.yesValues = {};
            this.yesFieldInstances.forEach((fieldInstance, index) => {
                const fieldConfig = this.yesFieldsConfig[index];
                const fieldValue = fieldInstance.getValue();
                const displayValue = this.extractDisplayValue(fieldValue, fieldInstance, fieldConfig);
                result.yesValues[fieldConfig.name || fieldConfig.id] = displayValue;
            });
        }
        if (mainValue === this.noOption.value && this.noFieldInstances.length > 0) {
            result.noValues = {};
            this.noFieldInstances.forEach((fieldInstance, index) => {
                const fieldConfig = this.noFieldsConfig[index];
                const fieldValue = fieldInstance.getValue();
                const displayValue = this.extractDisplayValue(fieldValue, fieldInstance, fieldConfig);
                result.noValues[fieldConfig.name || fieldConfig.id] = displayValue;
            });
        }
        return result;
    }
    // Method to extract display values for select/multi-select fields
    extractDisplayValue(value, fieldInstance, fieldConfig) {
        // Handle yes/no fields specifically to prevent double processing
        if (fieldConfig.type === 'yesno') {
            if (typeof value === 'boolean') {
                return value ? this.getText('yes') : this.getText('no');
            }
            if (value === 'yes' || value === 'no') {
                return value === 'yes' ? this.getText('yes') : this.getText('no');
            }
            // Handle true/false string values
            if (value === 'true' || value === 'false') {
                return value === 'true' ? this.getText('yes') : this.getText('no');
            }
            return value; // fallback
        }
        // For select and multi-select fields, get display names instead of IDs
        if (fieldConfig.type === 'select' || fieldConfig.type === 'multiselect' ||
            fieldConfig.type === 'select-with-other' || fieldConfig.type === 'multiselect-with-other') {
            if (Array.isArray(value)) {
                // Multi-select case
                return value.map(item => {
                        if (typeof item === 'object' && item.name) {
                            return typeof item.name === 'object' ?
                                (item.name[this.factory.texts?.language || 'fr'] || item.name.en || item.name.fr) :
                                item.name;
                        }
                        return this.getOptionDisplayName(item, fieldConfig);
                    })
                    .filter(Boolean)
                    .join(', ');
            } else if (typeof value === 'object' && value !== null) {
                // Single select with object value
                if (value.name) {
                    return typeof value.name === 'object' ?
                        (value.name[this.factory.texts?.language || 'fr'] || value.name.en || value.name.fr) :
                        value.name;
                }
                if (value.selectedValue) {
                    return this.extractDisplayValue(value.selectedValue, fieldInstance, fieldConfig);
                }
                if (value.value) {
                    return this.getOptionDisplayName(value.value, fieldConfig);
                }
                if (value.id) {
                    return this.getOptionDisplayName(value.id, fieldConfig);
                }
            } else {
                // Simple value - look up display name
                return this.getOptionDisplayName(value, fieldConfig);
            }
        }
        // For other field types, return the value as-is
        return value;
    }
    // Helper method to get display name for an option ID
    getOptionDisplayName(optionId, fieldConfig) {
        if (!optionId || !fieldConfig.options) return optionId;
        let options = fieldConfig.options;
        // If options is a string (data path), try to get it from factory
        if (typeof options === 'string' && this.factory.getData) {
            options = this.factory.getData(options);
        }
        if (Array.isArray(options)) {
            const option = options.find(opt => opt.id === optionId);
            if (option && option.name) {
                return typeof option.name === 'object' ?
                    (option.name[this.factory.texts?.language || 'fr'] || option.name.en || option.name.fr) :
                    option.name;
            }
        }
        return optionId; // Fallback to ID if display name not found
    }
    setValue(value) {
        let mainValue = value;
        if (typeof value === 'object' && value.main) {
            mainValue = value.main;
            if (value.yesValues && this.yesFieldInstances.length > 0) {
                this.yesFieldInstances.forEach((fieldInstance, index) => {
                    const fieldConfig = this.yesFieldsConfig[index];
                    const fieldName = fieldConfig.name || fieldConfig.id;
                    if (value.yesValues[fieldName] !== undefined) {
                        fieldInstance.setValue(value.yesValues[fieldName]);
                    }
                });
            }
            if (value.noValues && this.noFieldInstances.length > 0) {
                this.noFieldInstances.forEach((fieldInstance, index) => {
                    const fieldConfig = this.noFieldsConfig[index];
                    const fieldName = fieldConfig.name || fieldConfig.id;
                    if (value.noValues[fieldName] !== undefined) {
                        fieldInstance.setValue(value.noValues[fieldName]);
                    }
                });
            }
        }
        this.value = mainValue;
        if (this.container) {
            const radio = this.container.querySelector(`input[value="${mainValue}"]`);
            if (radio) {
                radio.checked = true;
                if (mainValue === this.yesOption.value) {
                    if (this.yesContainer) this.yesContainer.style.display = 'block';
                    if (this.noContainer) this.noContainer.style.display = 'none';
                } else if (mainValue === this.noOption.value) {
                    if (this.yesContainer) this.yesContainer.style.display = 'none';
                    if (this.noContainer) this.noContainer.style.display = 'block';
                }
            }
        }
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
    // Get display value for the main selection
    getMainDisplayValue() {
        const currentValue = this.getValue()
            .main;
        if (currentValue === this.yesOption.value) {
            return this.yesOption.label;
        } else if (currentValue === this.noOption.value) {
            return this.noOption.label;
        }
        return currentValue;
    }
    parseYesNoWithOptionsValue(fieldValue, fieldId) {
        if (!fieldValue || typeof fieldValue !== 'object' || fieldValue.main === undefined) {
            return {
                main: false,
                conditionalValues: {}
            };
        }
        let mainIsYes = fieldValue.main === true || fieldValue.main === 'yes';
        const result = {
            main: mainIsYes,
            conditionalValues: {}
        };
        // Extract conditional values based on main selection
        if (mainIsYes && fieldValue.yesValues) {
            Object.entries(fieldValue.yesValues)
                .forEach(([key, value]) => {
                    if (value !== undefined && value !== null && value !== '') {
                        result.conditionalValues[key] = value;
                    }
                });
        } else if (!mainIsYes && fieldValue.noValues) {
            // Handle "no" conditional values
        }
        return result;
    }
}
/**
 * SingleSelectField - Simple dropdown with personalized error messages
 */
class SingleSelectField extends BaseField {
    constructor(factory, config) {
        super(factory, config);
        this.options = config.options || [];
        this.placeholder = config.placeholder || factory.getText('selectPlaceholder');
        this.dropdownInstance = null;
        this.isOpen = false;
    }
    validate() {
        if (this.required && !this.getValue()) {
            this.showError(this.getFieldErrorMessage('required'));
            return false;
        }
        return super.validate();
    }
    render() {
        const container = this.createContainer();
        const label = this.createLabel();
        const mainContainer = document.createElement('div');
        mainContainer.className = 'main-container';
        this.element = document.createElement('select');
        this.element.id = this.id;
        this.element.name = this.name;
        this.element.style.display = 'none';
        const defaultOption = document.createElement('option');
        defaultOption.value = '';
        defaultOption.textContent = this.placeholder;
        this.element.appendChild(defaultOption);
        this.options.forEach(option => {
            const optionElement = document.createElement('option');
            optionElement.value = option.id;
            optionElement.textContent = option.name;
            this.element.appendChild(optionElement);
        });
        const selectWrapper = document.createElement('div');
        selectWrapper.className = 'select-wrapper';
        this.selectDisplayElement = document.createElement('div');
        this.selectDisplayElement.className = 'select-display placeholder';
        this.selectDisplayElement.innerHTML = `
            <span>${this.placeholder}</span>
            <div class="dropdown-icon">
                ${this.factory.SVG_ICONS.CHEVRON}
            </div>
        `;
        this.customOptionsElement = document.createElement('div');
        this.customOptionsElement.className = 'custom-options';
        this.options.forEach(option => {
            const customOption = document.createElement('div');
            customOption.className = 'custom-option';
            customOption.setAttribute('data-value', option.id);
            customOption.innerHTML = `
                <div class="option-checkbox">
                    ${this.factory.SVG_ICONS.CHECK}
                </div>
                <span>${option.name}</span>
            `;
            customOption.addEventListener('click', (e) => {
                e.stopPropagation();
                this.selectOption(option);
            });
            this.customOptionsElement.appendChild(customOption);
        });
        selectWrapper.appendChild(this.selectDisplayElement);
        selectWrapper.appendChild(this.customOptionsElement);
        this.selectDisplayElement.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleDropdown();
        });
        mainContainer.appendChild(this.element);
        mainContainer.appendChild(selectWrapper);
        const errorElement = this.createErrorElement();
        container.appendChild(label);
        container.appendChild(mainContainer);
        container.appendChild(errorElement);
        this.container = container;
        this.selectWrapper = selectWrapper;
        return container;
    }
    selectOption(option) {
        this.customOptionsElement.querySelectorAll('.custom-option')
            .forEach(opt => {
                opt.classList.remove('selected');
            });
        const optionElement = this.customOptionsElement.querySelector(`[data-value="${option.id}"]`);
        if (optionElement) {
            optionElement.classList.add('selected');
        }
        this.selectDisplayElement.querySelector('span')
            .textContent = option.name;
        this.selectDisplayElement.classList.remove('placeholder');
        this.element.value = option.id;
        this.value = option.id;
        this.closeDropdown();
        this.hideError();
        this.handleChange();
    }
    toggleDropdown() {
        if (this.isOpen) {
            this.closeDropdown();
        } else {
            this.openDropdown();
        }
    }
    openDropdown() {
        if (this.isOpen) return;
        this.factory.closeAllDropdowns();
        this.customOptionsElement.classList.add('show-options');
        this.selectDisplayElement.querySelector('.dropdown-icon')
            .classList.add('rotate');
        this.isOpen = true;
        this.dropdownInstance = {
            element: this.selectWrapper,
            close: () => this.closeDropdown()
        };
        this.factory.registerDropdown(this.dropdownInstance);
    }
    closeDropdown() {
        if (!this.isOpen) return;
        this.customOptionsElement.classList.remove('show-options');
        this.selectDisplayElement.querySelector('.dropdown-icon')
            .classList.remove('rotate');
        this.isOpen = false;
        if (this.dropdownInstance) {
            this.factory.unregisterDropdown(this.dropdownInstance);
            this.dropdownInstance = null;
        }
    }
    getValue() {
        return this.element ? this.element.value : this.value;
    }
    setValue(value) {
        this.value = value;
        if (this.element) {
            this.element.value = value;
            const option = this.options.find(opt => opt.id === value);
            if (option && this.selectDisplayElement) {
                this.selectDisplayElement.querySelector('span')
                    .textContent = option.name;
                this.selectDisplayElement.classList.remove('placeholder');
                if (this.customOptionsElement) {
                    this.customOptionsElement.querySelectorAll('.custom-option')
                        .forEach(opt => {
                            opt.classList.remove('selected');
                        });
                    const optionElement = this.customOptionsElement.querySelector(`[data-value="${value}"]`);
                    if (optionElement) {
                        optionElement.classList.add('selected');
                    }
                }
            }
        }
    }
}
/**
 * MultiSelectField - Multiple dropdown with personalized error messages
 */
class MultiSelectField extends BaseField {
    constructor(factory, config) {
        super(factory, config);
        this.options = config.options || [];
        this.placeholder = config.placeholder || factory.getText('selectMultiplePlaceholder');
        this.selectedValues = [];
        this.dropdownInstance = null;
        this.isOpen = false;
    }
    validate() {
        if (this.required && this.selectedValues.length === 0) {
            this.showError(this.getFieldErrorMessage('selectAtLeastOne'));
            return false;
        }
        return super.validate();
    }
    render() {
        const container = this.createContainer();
        const label = this.createLabel();
        const mainContainer = document.createElement('div');
        mainContainer.className = 'main-container';
        this.element = document.createElement('select');
        this.element.id = this.id;
        this.element.name = this.name;
        this.element.multiple = true;
        this.element.style.display = 'none';
        this.options.forEach(option => {
            const optionElement = document.createElement('option');
            optionElement.value = option.id;
            optionElement.textContent = option.name;
            this.element.appendChild(optionElement);
        });
        const selectWrapper = document.createElement('div');
        selectWrapper.className = 'select-wrapper multi-select';
        this.selectDisplayElement = document.createElement('div');
        this.selectDisplayElement.className = 'select-display placeholder';
        this.selectDisplayElement.innerHTML = `
            <span>${this.placeholder}</span>
            <div class="dropdown-icon">
                ${this.factory.SVG_ICONS.CHEVRON}
            </div>
        `;
        this.customOptionsElement = document.createElement('div');
        this.customOptionsElement.className = 'custom-options multi-select';
        const selectAllOption = document.createElement('div');
        selectAllOption.className = 'custom-option select-all-option';
        selectAllOption.innerHTML = `
            <div class="option-checkbox">
                ${this.factory.SVG_ICONS.CHECK}
            </div>
            <span>${this.factory.getText('selectAll')}</span>
        `;
        selectAllOption.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleSelectAll();
        });
        this.customOptionsElement.appendChild(selectAllOption);
        this.options.forEach(option => {
            const customOption = document.createElement('div');
            customOption.className = 'custom-option';
            customOption.setAttribute('data-value', option.id);
            customOption.innerHTML = `
                <div class="option-checkbox">
                    ${this.factory.SVG_ICONS.CHECK}
                </div>
                <span>${option.name}</span>
            `;
            customOption.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleOption(option, customOption);
            });
            this.customOptionsElement.appendChild(customOption);
        });
        selectWrapper.appendChild(this.selectDisplayElement);
        selectWrapper.appendChild(this.customOptionsElement);
        this.selectDisplayElement.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleDropdown();
        });
        mainContainer.appendChild(this.element);
        mainContainer.appendChild(selectWrapper);
        const errorElement = this.createErrorElement();
        container.appendChild(label);
        container.appendChild(mainContainer);
        container.appendChild(errorElement);
        this.container = container;
        this.selectWrapper = selectWrapper;
        return container;
    }
    toggleOption(option, customOption) {
        const isSelected = customOption.classList.contains('selected');
        const optElement = this.element.querySelector(`option[value="${option.id}"]`);
        if (isSelected) {
            customOption.classList.remove('selected');
            if (optElement) optElement.selected = false;
            this.selectedValues = this.selectedValues.filter(val => val !== option.id);
        } else {
            customOption.classList.add('selected');
            if (optElement) optElement.selected = true;
            this.selectedValues.push(option.id);
        }
        this.updateDisplayText();
        this.updateSelectAllState();
        this.value = this.selectedValues;
        this.hideError();
        this.handleChange();
    }
    toggleSelectAll() {
        const allOptions = this.customOptionsElement.querySelectorAll('.custom-option:not(.select-all-option)');
        const selectAllOption = this.customOptionsElement.querySelector('.select-all-option');
        const allSelected = Array.from(allOptions)
            .every(opt => opt.classList.contains('selected'));
        allOptions.forEach(opt => {
            const optValue = opt.dataset.value;
            const optElement = this.element.querySelector(`option[value="${optValue}"]`);
            if (allSelected) {
                opt.classList.remove('selected');
                if (optElement) optElement.selected = false;
            } else {
                opt.classList.add('selected');
                if (optElement) optElement.selected = true;
            }
        });
        if (allSelected) {
            selectAllOption.classList.remove('selected');
            this.selectedValues = [];
        } else {
            selectAllOption.classList.add('selected');
            this.selectedValues = this.options.map(opt => opt.id);
        }
        this.updateDisplayText();
        this.value = this.selectedValues;
        this.handleChange();
    }
    updateSelectAllState() {
        const allOptions = this.customOptionsElement.querySelectorAll('.custom-option:not(.select-all-option)');
        const selectAllOption = this.customOptionsElement.querySelector('.select-all-option');
        const allSelected = Array.from(allOptions)
            .every(opt => opt.classList.contains('selected'));
        if (allSelected && this.selectedValues.length > 0) {
            selectAllOption.classList.add('selected');
        } else {
            selectAllOption.classList.remove('selected');
        }
    }
    updateDisplayText() {
        const span = this.selectDisplayElement.querySelector('span');
        if (this.selectedValues.length === 0) {
            span.textContent = this.placeholder;
            this.selectDisplayElement.classList.add('placeholder');
        } else if (this.selectedValues.length === 1) {
            const option = this.options.find(opt => opt.id === this.selectedValues[0]);
            span.textContent = option ? option.name : this.selectedValues[0];
            this.selectDisplayElement.classList.remove('placeholder');
        } else {
            span.textContent = `${this.selectedValues.length} ${this.factory.getText('selected')}`;
            this.selectDisplayElement.classList.remove('placeholder');
        }
    }
    toggleDropdown() {
        if (this.isOpen) {
            this.closeDropdown();
        } else {
            this.openDropdown();
        }
    }
    openDropdown() {
        if (this.isOpen) return;
        this.factory.closeAllDropdowns();
        this.customOptionsElement.classList.add('show-options');
        this.selectDisplayElement.querySelector('.dropdown-icon')
            .classList.add('rotate');
        this.isOpen = true;
        this.dropdownInstance = {
            element: this.selectWrapper,
            close: () => this.closeDropdown()
        };
        this.factory.registerDropdown(this.dropdownInstance);
    }
    closeDropdown() {
        if (!this.isOpen) return;
        this.customOptionsElement.classList.remove('show-options');
        this.selectDisplayElement.querySelector('.dropdown-icon')
            .classList.remove('rotate');
        this.isOpen = false;
        if (this.dropdownInstance) {
            this.factory.unregisterDropdown(this.dropdownInstance);
            this.dropdownInstance = null;
        }
    }
    getValue() {
        return this.selectedValues;
    }
    setValue(values) {
        this.selectedValues = Array.isArray(values) ? values : [];
        this.value = this.selectedValues;
        if (this.element) {
            Array.from(this.element.options)
                .forEach(option => {
                    option.selected = this.selectedValues.includes(option.value);
                });
            if (this.customOptionsElement) {
                this.customOptionsElement.querySelectorAll('.custom-option:not(.select-all-option)')
                    .forEach(opt => {
                        if (this.selectedValues.includes(opt.dataset.value)) {
                            opt.classList.add('selected');
                        } else {
                            opt.classList.remove('selected');
                        }
                    });
                this.updateSelectAllState();
            }
            if (this.selectDisplayElement) {
                this.updateDisplayText();
            }
        }
    }
}
/**
 * SingleSelectSubsectionsField - Single select dropdown with nested subsections and personalized error messages
 */
class SingleSelectSubsectionsField extends BaseField {
    constructor(factory, config) {
        super(factory, config);
        // Resolve subsectionOptions from string reference to actual data
        if (typeof config.subsectionOptions === 'string') {
            // Try multiple ways to access the form data
            let optionsData = null;
            // Method 1: From factory
            if (factory.formData && factory.formData.options) {
                optionsData = factory.formData.options;
            }
            // Method 2: From factory.data
            else if (factory.data && factory.data.options) {
                optionsData = factory.data.options;
            }
            // Method 3: Direct from factory
            else if (factory.options) {
                optionsData = factory.options;
            }
            // Method 4: From global PropertySearchFormExtension
            else if (typeof window !== 'undefined' && window.PropertySearchFormExtension && window.PropertySearchFormExtension.FORM_DATA) {
                optionsData = window.PropertySearchFormExtension.FORM_DATA.options;
            }
            // Method 5: From global PropertySellFormExtension
            else if (typeof window !== 'undefined' && window.PropertySellFormExtension && window.PropertySellFormExtension.FORM_DATA) {
                optionsData = window.PropertySellFormExtension.FORM_DATA.options;
            }
            // Method 6: From config itself
            else if (config.formData && config.formData.options) {
                optionsData = config.formData.options;
            }
            this.subsectionOptions = (optionsData && optionsData[config.subsectionOptions]) || [];
        } else {
            this.subsectionOptions = config.subsectionOptions || [];
        }
        // Ensure we have an array
        if (!Array.isArray(this.subsectionOptions)) {
            console.warn('subsectionOptions is not an array, using empty array');
            this.subsectionOptions = [];
        }
        this.placeholder = config.placeholder || factory.getText('selectSubsectionPlaceholder');
        this.dropdownInstance = null;
        this.isOpen = false;
    }
    validate() {
        if (this.required && !this.getValue()) {
            this.showError(this.getFieldErrorMessage('required'));
            return false;
        }
        return super.validate();
    }
    render() {
        const container = this.createContainer();
        const label = this.createLabel();
        const mainContainer = document.createElement('div');
        mainContainer.className = 'main-container';
        this.element = document.createElement('select');
        this.element.id = this.id;
        this.element.name = this.name;
        this.element.style.display = 'none';
        const defaultOption = document.createElement('option');
        defaultOption.value = '';
        defaultOption.textContent = this.placeholder;
        this.element.appendChild(defaultOption);
        const selectWrapper = document.createElement('div');
        selectWrapper.className = 'select-wrapper';
        this.selectDisplayElement = document.createElement('div');
        this.selectDisplayElement.className = 'select-display placeholder';
        this.selectDisplayElement.innerHTML = `
            <span>${this.placeholder}</span>
            <div class="dropdown-icon">
                ${this.factory.SVG_ICONS.CHEVRON}
            </div>
        `;
        this.customOptionsElement = document.createElement('div');
        this.customOptionsElement.className = 'custom-options';
        this.buildSubsectionOptions();
        selectWrapper.appendChild(this.selectDisplayElement);
        selectWrapper.appendChild(this.customOptionsElement);
        this.selectDisplayElement.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleDropdown();
        });
        mainContainer.appendChild(this.element);
        mainContainer.appendChild(selectWrapper);
        const errorElement = this.createErrorElement();
        container.appendChild(label);
        container.appendChild(mainContainer);
        container.appendChild(errorElement);
        this.container = container;
        this.selectWrapper = selectWrapper;
        return container;
    }
    buildSubsectionOptions() {
        // Ensure subsectionOptions is an array
        if (!Array.isArray(this.subsectionOptions)) {
            console.error('subsectionOptions is not an array:', this.subsectionOptions);
            return;
        }
        // Get language from factory with fallbacks
        const language = this.factory?.config?.language || this.factory?.language || 'fr';
        this.subsectionOptions.forEach(group => {
            const mainDiv = document.createElement('div');
            mainDiv.className = 'custom-option category-option';
            mainDiv.dataset.value = group.id;
            // Handle multilingual names with better fallbacks
            let groupName = group.name;
            if (typeof group.name === 'object' && group.name !== null) {
                groupName = group.name[language] || group.name.fr || group.name.en || Object.values(group.name)[0] || group.name;
            }
            mainDiv.innerHTML = `
                <span>${groupName}</span>
                <div class="main-arrow">
                    <div class="arrow-icon">${this.factory.SVG_ICONS.CHEVRON}</div>
                </div>
            `;
            mainDiv.addEventListener('click', (e) => {
                e.stopPropagation();
                if (mainDiv.classList.contains('expanded')) {
                    this.collapseSection(mainDiv);
                } else {
                    this.expandSection(mainDiv, group);
                }
            });
            this.customOptionsElement.appendChild(mainDiv);
        });
    }
    expandSection(mainDiv, group) {
        // Close other expanded sections
        this.customOptionsElement.querySelectorAll('.custom-option.category-option.expanded')
            .forEach(opt => {
                this.collapseSection(opt);
            });
        mainDiv.classList.add('expanded');
        mainDiv.querySelector('.arrow-icon')
            .classList.add('rotate');
        const subWrapper = document.createElement('div');
        subWrapper.className = 'sub-options';
        // Get language from factory with fallbacks
        const language = this.factory?.config?.language || this.factory?.language || 'fr';
        group.subcategories.forEach(item => {
            // Handle multilingual names for subcategories with better fallbacks
            let itemName = item.name;
            if (typeof item.name === 'object' && item.name !== null) {
                itemName = item.name[language] || item.name.fr || item.name.en || Object.values(item.name)[0] || item.name;
            }
            const subDiv = document.createElement('div');
            subDiv.className = 'custom-option';
            subDiv.dataset.value = item.id;
            const checkboxDiv = document.createElement('div');
            checkboxDiv.className = 'option-checkbox';
            checkboxDiv.innerHTML = this.factory.SVG_ICONS.CHECK;
            const itemSpan = document.createElement('span');
            itemSpan.textContent = itemName;
            subDiv.appendChild(checkboxDiv);
            subDiv.appendChild(itemSpan);
            // Check if already selected
            if (this.value === item.id) {
                subDiv.classList.add('selected');
            }
            subDiv.addEventListener('click', (e) => {
                e.stopPropagation();
                this.selectOption(item);
            });
            subWrapper.appendChild(subDiv);
        });
        mainDiv.insertAdjacentElement('afterend', subWrapper);
    }
    collapseSection(mainDiv) {
        mainDiv.classList.remove('expanded');
        if (mainDiv.nextElementSibling && mainDiv.nextElementSibling.classList.contains('sub-options')) {
            mainDiv.nextElementSibling.remove();
        }
        const arrow = mainDiv.querySelector('.arrow-icon');
        if (arrow) arrow.classList.remove('rotate');
    }
    selectOption(option) {
        // Get language from factory with fallbacks
        const language = this.factory?.config?.language || this.factory?.language || 'fr';
        // Handle multilingual names for display
        let optionName = option.name;
        if (typeof option.name === 'object' && option.name !== null) {
            optionName = option.name[language] || option.name.fr || option.name.en || Object.values(option.name)[0] || option.name;
        }
        // Clear all selections
        this.customOptionsElement.querySelectorAll('.custom-option.selected')
            .forEach(opt => {
                opt.classList.remove('selected');
            });
        // Select the clicked option
        const optionElement = this.customOptionsElement.querySelector(`[data-value="${option.id}"]`);
        if (optionElement) {
            optionElement.classList.add('selected');
        }
        this.selectDisplayElement.querySelector('span')
            .textContent = optionName;
        this.selectDisplayElement.classList.remove('placeholder');
        // FIX: Create the option element if it doesn't exist
        let optionEl = this.element.querySelector(`option[value="${option.id}"]`);
        if (!optionEl) {
            optionEl = document.createElement('option');
            optionEl.value = option.id;
            optionEl.textContent = optionName;
            this.element.appendChild(optionEl);
        }
        this.element.value = option.id;
        this.value = option.id;
        this.closeDropdown();
        this.hideError();
        this.handleChange();
    }
    toggleDropdown() {
        if (this.isOpen) {
            this.closeDropdown();
        } else {
            this.openDropdown();
        }
    }
    openDropdown() {
        if (this.isOpen) return;
        this.factory.closeAllDropdowns();
        this.customOptionsElement.classList.add('show-options');
        this.selectDisplayElement.querySelector('.dropdown-icon')
            .classList.add('rotate');
        this.isOpen = true;
        this.dropdownInstance = {
            element: this.selectWrapper,
            close: () => this.closeDropdown()
        };
        this.factory.registerDropdown(this.dropdownInstance);
    }
    closeDropdown() {
        if (!this.isOpen) return;
        this.customOptionsElement.classList.remove('show-options');
        this.selectDisplayElement.querySelector('.dropdown-icon')
            .classList.remove('rotate');
        this.isOpen = false;
        // Collapse all expanded sections
        this.customOptionsElement.querySelectorAll('.sub-options')
            .forEach(sw => sw.remove());
        this.customOptionsElement.querySelectorAll('.custom-option.category-option.expanded')
            .forEach(opt => {
                this.collapseSection(opt);
            });
        if (this.dropdownInstance) {
            this.factory.unregisterDropdown(this.dropdownInstance);
            this.dropdownInstance = null;
        }
    }
    getValue() {
        return this.element ? this.element.value : this.value;
    }
    setValue(value) {
        this.value = value;
        if (this.element) {
            // Get language from factory with fallbacks
            const language = this.factory?.config?.language || this.factory?.language || 'fr';
            // Find the option in subsections
            for (const group of this.subsectionOptions) {
                const option = group.subcategories.find(opt => opt.id === value);
                if (option) {
                    // Handle multilingual names for display
                    let optionName = option.name;
                    if (typeof option.name === 'object' && option.name !== null) {
                        optionName = option.name[language] || option.name.fr || option.name.en || Object.values(option.name)[0] || option.name;
                    }
                    // Create the option element if it doesn't exist
                    let optionEl = this.element.querySelector(`option[value="${option.id}"]`);
                    if (!optionEl) {
                        optionEl = document.createElement('option');
                        optionEl.value = option.id;
                        optionEl.textContent = optionName;
                        this.element.appendChild(optionEl);
                    }
                    this.element.value = value;
                    if (this.selectDisplayElement) {
                        this.selectDisplayElement.querySelector('span')
                            .textContent = optionName;
                        this.selectDisplayElement.classList.remove('placeholder');
                    }
                    break;
                }
            }
        }
    }
    cleanup() {
        this.closeDropdown();
        super.cleanup();
    }
}
/**
 * MultiSelectSubsectionsField - Multi-select dropdown with nested subsections and personalized error messages
 */
class MultiSelectSubsectionsField extends BaseField {
    constructor(factory, config) {
        super(factory, config);
        // Resolve subsectionOptions from string reference to actual data
        if (typeof config.subsectionOptions === 'string') {
            // Try multiple ways to access the form data
            let optionsData = null;
            // Method 1: From factory
            if (factory.formData && factory.formData.options) {
                optionsData = factory.formData.options;
            }
            // Method 2: From factory.data
            else if (factory.data && factory.data.options) {
                optionsData = factory.data.options;
            }
            // Method 3: Direct from factory
            else if (factory.options) {
                optionsData = factory.options;
            }
            // Method 4: From global PropertySearchFormExtension
            else if (typeof window !== 'undefined' && window.PropertySearchFormExtension && window.PropertySearchFormExtension.FORM_DATA) {
                optionsData = window.PropertySearchFormExtension.FORM_DATA.options;
            }
            // Method 5: From config itself
            else if (config.formData && config.formData.options) {
                optionsData = config.formData.options;
            }
            this.subsectionOptions = (optionsData && optionsData[config.subsectionOptions]) || [];
        } else {
            this.subsectionOptions = config.subsectionOptions || [];
        }
        // Ensure we have an array
        if (!Array.isArray(this.subsectionOptions)) {
            console.warn('subsectionOptions is not an array, using empty array');
            this.subsectionOptions = [];
        }
        this.placeholder = config.placeholder || factory.getText('selectMultiplePlaceholder');
        this.selectedValues = [];
        this.dropdownInstance = null;
        this.isOpen = false;
    }
    validate() {
        if (this.required && this.selectedValues.length === 0) {
            this.showError(this.getFieldErrorMessage('selectAtLeastOne'));
            return false;
        }
        return super.validate();
    }
    render() {
        const container = this.createContainer();
        const label = this.createLabel();
        const mainContainer = document.createElement('div');
        mainContainer.className = 'main-container';
        this.element = document.createElement('select');
        this.element.id = this.id;
        this.element.name = this.name;
        this.element.multiple = true;
        this.element.style.display = 'none';
        const selectWrapper = document.createElement('div');
        selectWrapper.className = 'select-wrapper multi-select';
        this.selectDisplayElement = document.createElement('div');
        this.selectDisplayElement.className = 'select-display placeholder';
        this.selectDisplayElement.innerHTML = `
            <span>${this.placeholder}</span>
            <div class="dropdown-icon">
                ${this.factory.SVG_ICONS.CHEVRON}
            </div>
        `;
        this.customOptionsElement = document.createElement('div');
        this.customOptionsElement.className = 'custom-options multi-select';
        this.buildSubsectionOptions();
        selectWrapper.appendChild(this.selectDisplayElement);
        selectWrapper.appendChild(this.customOptionsElement);
        this.selectDisplayElement.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleDropdown();
        });
        mainContainer.appendChild(this.element);
        mainContainer.appendChild(selectWrapper);
        const errorElement = this.createErrorElement();
        container.appendChild(label);
        container.appendChild(mainContainer);
        container.appendChild(errorElement);
        this.container = container;
        this.selectWrapper = selectWrapper;
        return container;
    }
    buildSubsectionOptions() {
        // Ensure subsectionOptions is an array
        if (!Array.isArray(this.subsectionOptions)) {
            console.error('subsectionOptions is not an array:', this.subsectionOptions);
            return;
        }
        // Get language from factory with fallbacks
        const language = this.factory?.config?.language || this.factory?.language || 'fr';
        // Add Select All option
        const selectAllDiv = document.createElement('div');
        selectAllDiv.className = 'custom-option select-all-option';
        selectAllDiv.dataset.value = 'select_all';
        const allCheckbox = document.createElement('div');
        allCheckbox.className = 'option-checkbox';
        allCheckbox.innerHTML = this.factory.SVG_ICONS.CHECK;
        const allText = document.createElement('span');
        allText.textContent = this.factory.getText('selectAll');
        selectAllDiv.appendChild(allCheckbox);
        selectAllDiv.appendChild(allText);
        selectAllDiv.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleSelectAll();
        });
        this.customOptionsElement.appendChild(selectAllDiv);
        // Add subsection groups
        this.subsectionOptions.forEach(group => {
            const mainDiv = document.createElement('div');
            mainDiv.className = 'custom-option category-option';
            mainDiv.dataset.value = group.id;
            // Handle multilingual names with better fallbacks
            let groupName = group.name;
            if (typeof group.name === 'object' && group.name !== null) {
                groupName = group.name[language] || group.name.fr || group.name.en || Object.values(group.name)[0] || group.name;
            }
            mainDiv.innerHTML = `
                <span>${groupName}</span>
                <div class="main-arrow">
                    <div class="arrow-icon">${this.factory.SVG_ICONS.CHEVRON}</div>
                </div>
            `;
            mainDiv.addEventListener('click', (e) => {
                e.stopPropagation();
                if (mainDiv.classList.contains('expanded')) {
                    this.collapseSection(mainDiv);
                } else {
                    this.expandSection(mainDiv, group);
                }
            });
            this.customOptionsElement.appendChild(mainDiv);
        });
    }
    expandSection(mainDiv, group) {
        // Close other expanded sections
        this.customOptionsElement.querySelectorAll('.custom-option.category-option.expanded')
            .forEach(opt => {
                this.collapseSection(opt);
            });
        mainDiv.classList.add('expanded');
        mainDiv.querySelector('.arrow-icon')
            .classList.add('rotate');
        const subWrapper = document.createElement('div');
        subWrapper.className = 'sub-options';
        // Get language from factory with fallbacks
        const language = this.factory?.config?.language || this.factory?.language || 'fr';
        // Add Select All for this group
        const selectAllDiv = document.createElement('div');
        selectAllDiv.className = 'custom-option select-all-option';
        selectAllDiv.dataset.value = `select_all_${group.id}`;
        const allCheckbox = document.createElement('div');
        allCheckbox.className = 'option-checkbox';
        allCheckbox.innerHTML = this.factory.SVG_ICONS.CHECK;
        const allSpan = document.createElement('span');
        allSpan.textContent = this.factory.getText('selectAll');
        selectAllDiv.appendChild(allCheckbox);
        selectAllDiv.appendChild(allSpan);
        selectAllDiv.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleSelectAllInGroup(group, subWrapper);
        });
        subWrapper.appendChild(selectAllDiv);
        group.subcategories.forEach(item => {
            // Handle multilingual names for subcategories with better fallbacks
            let itemName = item.name;
            if (typeof item.name === 'object' && item.name !== null) {
                itemName = item.name[language] || item.name.fr || item.name.en || Object.values(item.name)[0] || item.name;
            }
            this.element.appendChild(new Option(itemName, item.id));
            const subDiv = document.createElement('div');
            subDiv.className = 'custom-option';
            subDiv.dataset.value = item.id;
            const checkboxDiv = document.createElement('div');
            checkboxDiv.className = 'option-checkbox';
            checkboxDiv.innerHTML = this.factory.SVG_ICONS.CHECK;
            const itemSpan = document.createElement('span');
            itemSpan.textContent = itemName;
            subDiv.appendChild(checkboxDiv);
            subDiv.appendChild(itemSpan);
            // Check if already selected
            if (this.selectedValues.includes(item.id)) {
                subDiv.classList.add('selected');
                const subOption = this.element.querySelector(`option[value="${item.id}"]`);
                if (subOption) subOption.selected = true;
            }
            subDiv.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleOption(item, subDiv, subWrapper);
            });
            subWrapper.appendChild(subDiv);
        });
        // Update group select all state
        this.updateGroupSelectAllState(group, subWrapper);
        mainDiv.insertAdjacentElement('afterend', subWrapper);
    }
    collapseSection(mainDiv) {
        mainDiv.classList.remove('expanded');
        if (mainDiv.nextElementSibling && mainDiv.nextElementSibling.classList.contains('sub-options')) {
            mainDiv.nextElementSibling.remove();
        }
        const arrow = mainDiv.querySelector('.arrow-icon');
        if (arrow) arrow.classList.remove('rotate');
    }
    toggleOption(option, customOption, subWrapper) {
        const isSelected = customOption.classList.contains('selected');
        const optElement = this.element.querySelector(`option[value="${option.id}"]`);
        if (isSelected) {
            customOption.classList.remove('selected');
            if (optElement) optElement.selected = false;
            this.selectedValues = this.selectedValues.filter(val => val !== option.id);
        } else {
            customOption.classList.add('selected');
            if (optElement) optElement.selected = true;
            this.selectedValues.push(option.id);
        }
        this.updateDisplayText();
        this.updateSelectAllStates(subWrapper);
        this.value = this.selectedValues;
        this.hideError();
        this.handleChange();
    }
    toggleSelectAllInGroup(group, subWrapper) {
        const subOptions = subWrapper.querySelectorAll('.custom-option:not(.select-all-option)');
        const selectAllOption = subWrapper.querySelector('.select-all-option');
        const allSelected = Array.from(subOptions)
            .every(opt => opt.classList.contains('selected'));
        subOptions.forEach(opt => {
            const optValue = opt.dataset.value;
            const optElement = this.element.querySelector(`option[value="${optValue}"]`);
            if (allSelected) {
                opt.classList.remove('selected');
                if (optElement) optElement.selected = false;
                this.selectedValues = this.selectedValues.filter(val => val !== optValue);
            } else {
                opt.classList.add('selected');
                if (optElement) optElement.selected = true;
                if (!this.selectedValues.includes(optValue)) {
                    this.selectedValues.push(optValue);
                }
            }
        });
        selectAllOption.classList.toggle('selected', !allSelected);
        this.updateDisplayText();
        this.updateGlobalSelectAllState();
        this.value = this.selectedValues;
        this.handleChange();
    }
    toggleSelectAll() {
        const globalSelectAll = this.customOptionsElement.querySelector('.select-all-option[data-value="select_all"]');
        const allSubOptions = [];
        // Collect all subcategory options
        this.subsectionOptions.forEach(group => {
            group.subcategories.forEach(item => {
                allSubOptions.push(item.id);
            });
        });
        const allSelected = allSubOptions.every(id => this.selectedValues.includes(id));
        if (allSelected) {
            // Deselect all
            this.selectedValues = [];
            globalSelectAll.classList.remove('selected');
            // Update all visible options
            this.customOptionsElement.querySelectorAll('.custom-option:not(.select-all-option):not(.category-option)')
                .forEach(opt => {
                    opt.classList.remove('selected');
                    const optElement = this.element.querySelector(`option[value="${opt.dataset.value}"]`);
                    if (optElement) optElement.selected = false;
                });
        } else {
            // Select all
            this.selectedValues = [...allSubOptions];
            globalSelectAll.classList.add('selected');
            // Update all visible options
            this.customOptionsElement.querySelectorAll('.custom-option:not(.select-all-option):not(.category-option)')
                .forEach(opt => {
                    opt.classList.add('selected');
                    const optElement = this.element.querySelector(`option[value="${opt.dataset.value}"]`);
                    if (optElement) optElement.selected = true;
                });
        }
        this.updateDisplayText();
        this.value = this.selectedValues;
        this.handleChange();
    }
    updateGroupSelectAllState(group, subWrapper) {
        const subOptions = subWrapper.querySelectorAll('.custom-option:not(.select-all-option)');
        const selectAllOption = subWrapper.querySelector('.select-all-option');
        const allSelected = Array.from(subOptions)
            .every(opt => opt.classList.contains('selected'));
        if (allSelected && subOptions.length > 0) {
            selectAllOption.classList.add('selected');
        } else {
            selectAllOption.classList.remove('selected');
        }
    }
    updateSelectAllStates(subWrapper = null) {
        if (subWrapper) {
            // Update group select all
            const subOptions = subWrapper.querySelectorAll('.custom-option:not(.select-all-option)');
            const selectAllOption = subWrapper.querySelector('.select-all-option');
            const allSelected = Array.from(subOptions)
                .every(opt => opt.classList.contains('selected'));
            selectAllOption.classList.toggle('selected', allSelected && subOptions.length > 0);
        }
        this.updateGlobalSelectAllState();
    }
    updateGlobalSelectAllState() {
        const globalSelectAll = this.customOptionsElement.querySelector('.select-all-option[data-value="select_all"]');
        const allSubOptions = [];
        this.subsectionOptions.forEach(group => {
            group.subcategories.forEach(item => {
                allSubOptions.push(item.id);
            });
        });
        const allSelected = allSubOptions.length > 0 && allSubOptions.every(id => this.selectedValues.includes(id));
        globalSelectAll.classList.toggle('selected', allSelected);
    }
    updateDisplayText() {
        const span = this.selectDisplayElement.querySelector('span');
        if (this.selectedValues.length === 0) {
            span.textContent = this.placeholder;
            this.selectDisplayElement.classList.add('placeholder');
        } else if (this.selectedValues.length === 1) {
            // Get language from factory with fallbacks
            const language = this.factory?.config?.language || this.factory?.language || 'fr';
            // Find the option name
            for (const group of this.subsectionOptions) {
                const option = group.subcategories.find(opt => opt.id === this.selectedValues[0]);
                if (option) {
                    let optionName = option.name;
                    if (typeof option.name === 'object' && option.name !== null) {
                        optionName = option.name[language] || option.name.fr || option.name.en || Object.values(option.name)[0] || option.name;
                    }
                    span.textContent = optionName;
                    break;
                }
            }
            this.selectDisplayElement.classList.remove('placeholder');
        } else {
            span.textContent = `${this.selectedValues.length} ${this.factory.getText('selected')}`;
            this.selectDisplayElement.classList.remove('placeholder');
        }
    }
    toggleDropdown() {
        if (this.isOpen) {
            this.closeDropdown();
        } else {
            this.openDropdown();
        }
    }
    openDropdown() {
        if (this.isOpen) return;
        this.factory.closeAllDropdowns();
        this.customOptionsElement.classList.add('show-options');
        this.selectDisplayElement.querySelector('.dropdown-icon')
            .classList.add('rotate');
        this.isOpen = true;
        this.dropdownInstance = {
            element: this.selectWrapper,
            close: () => this.closeDropdown()
        };
        this.factory.registerDropdown(this.dropdownInstance);
    }
    closeDropdown() {
        if (!this.isOpen) return;
        this.customOptionsElement.classList.remove('show-options');
        this.selectDisplayElement.querySelector('.dropdown-icon')
            .classList.remove('rotate');
        this.isOpen = false;
        // Collapse all expanded sections
        this.customOptionsElement.querySelectorAll('.sub-options')
            .forEach(sw => sw.remove());
        this.customOptionsElement.querySelectorAll('.custom-option.category-option.expanded')
            .forEach(opt => {
                this.collapseSection(opt);
            });
        if (this.dropdownInstance) {
            this.factory.unregisterDropdown(this.dropdownInstance);
            this.dropdownInstance = null;
        }
    }
    getValue() {
        return this.selectedValues;
    }
    setValue(values) {
        this.selectedValues = Array.isArray(values) ? values : [];
        this.value = this.selectedValues;
        if (this.element) {
            Array.from(this.element.options)
                .forEach(option => {
                    option.selected = this.selectedValues.includes(option.value);
                });
            this.updateDisplayText();
        }
    }
    cleanup() {
        this.closeDropdown();
        super.cleanup();
    }
}
/**
 * CustomField - For special content like summaries with personalized error messages
 */
class CustomField extends BaseField {
    constructor(factory, config) {
        // Call parent constructor with appropriate config
        super(factory, {
            ...config,
            required: false, // Custom fields are never required
            label: config.label || '', // Usually no label for custom fields
        });
        this.renderFunction = config.render || null;
        this.updateFunction = config.update || null;
        this.autoSummary = config.autoSummary || false;
        // Use the same processor as the data transformer
        this.processor = factory.getDataProcessor() || new FormDataProcessor(factory.creatFormInstance);
        this.formatter = factory.getFormatter() || new FieldValueFormatter(factory.creatFormInstance);
    }
    // ============================================================================
    // NEW: INDIFFERENT VALUE DETECTION
    // ============================================================================
    /**
     * Check if value represents "indifferent" or "any" choice
     */
    isIndifferentValue(value, fieldConfig) {
        // Handle null/undefined values
        if (value === null || value === undefined || value === '') {
            return true;
        }
        // Handle options-slider fields with value 0 (indifferent)
        if (fieldConfig?.type === 'options-slider') {
            if (typeof value === 'object' && value !== null) {
                if (value.value !== undefined) {
                    return value.value === 0;
                }
                if (value.display && typeof value.display === 'string') {
                    const display = value.display.toLowerCase();
                    return display.includes('indifférent') || display.includes('indifferent') || display.includes('any');
                }
            }
            return value === 0;
        }
        // Handle string values that explicitly indicate indifference
        if (typeof value === 'string') {
            const lowerValue = value.toLowerCase()
                .trim();
            return lowerValue === '' ||
                lowerValue === 'null' ||
                lowerValue.includes('indifférent') ||
                lowerValue.includes('indifferent') ||
                lowerValue.includes('any') ||
                lowerValue === '0';
        }
        // Handle numeric values (0 typically means indifferent)
        if (typeof value === 'number') {
            return value === 0;
        }
        return false;
    }
    /**
     * Check if yes/no field has been properly answered
     */
    isYesNoFieldAnswered(value, fieldConfig) {
        if (fieldConfig?.type === 'yesno' || fieldConfig?.type === 'yesno-with-options') {
            // Consider null, undefined, empty string as not answered
            if (value === null || value === undefined || value === '') {
                return false;
            }
            // For yesno-with-options, check if main value is set
            if (fieldConfig.type === 'yesno-with-options' && typeof value === 'object') {
                return value.main !== null && value.main !== undefined && value.main !== '';
            }
            // For regular yesno, check if it's a valid boolean or string response
            if (typeof value === 'boolean') {
                return true;
            }
            if (typeof value === 'string') {
                const lowerValue = value.toLowerCase()
                    .trim();
                return lowerValue === 'yes' || lowerValue === 'no' ||
                    lowerValue === 'oui' || lowerValue === 'non' ||
                    lowerValue === 'true' || lowerValue === 'false';
            }
        }
        return true; // Not a yes/no field, consider it answered
    }
    /**
     * Enhanced shouldDisplayFieldInSummary with indifferent value filtering
     */
    shouldDisplayFieldInSummary(fieldConfig, fieldValue) {
        // First check basic display conditions
        if (!this.formatter.shouldDisplayValue(fieldValue)) {
            return false;
        }
        // Check if it's an indifferent value
        if (this.isIndifferentValue(fieldValue, fieldConfig)) {
            return false;
        }
        // Check if yes/no field is properly answered
        if (!this.isYesNoFieldAnswered(fieldValue, fieldConfig)) {
            return false;
        }
        // For yesno-with-options, check if any meaningful data exists
        if (fieldConfig?.type === 'yesno-with-options' && typeof fieldValue === 'object' && fieldValue !== null) {
            // If main is answered but no sub-values, still show the main answer
            if (fieldValue.main !== null && fieldValue.main !== undefined && fieldValue.main !== '') {
                return true;
            }
            return false;
        }
        // For arrays, check if there are actual non-indifferent values
        if (Array.isArray(fieldValue)) {
            return fieldValue.some(item => !this.isIndifferentValue(item, fieldConfig));
        }
        return true;
    }
    // ============================================================================
    // NEW: Safe string conversion method
    // ============================================================================
    /**
     * NEW: Safe method to convert any value to string for display
     */
    safeConvertToString(value) {
        // Handle null/undefined
        if (value === null || value === undefined) {
            return '';
        }
        // Handle arrays
        if (Array.isArray(value)) {
            // Recursively convert array elements to strings
            return value.map(item => this.safeConvertToString(item))
                .join(', ');
        }
        // Handle objects with toString method
        if (typeof value === 'object' && value !== null) {
            // Check if object has a custom toString method
            if (typeof value.toString === 'function' && value.toString !== Object.prototype.toString) {
                try {
                    const result = value.toString();
                    if (result && result !== '[object Object]') {
                        return result;
                    }
                } catch (error) {
                    console.warn('Error calling toString:', error);
                }
            }
            // Handle objects with _separateFields flag (like CategoryItemFilterField)
            if (value._separateFields && value._fieldLabels) {
                const parts = [];
                Object.keys(value._fieldLabels)
                    .forEach(key => {
                        if (value[key] && typeof value[key] === 'string' && value[key].trim() !== '') {
                            parts.push(`${value._fieldLabels[key]}: ${value[key]}`);
                        } else if (value[key] && typeof value[key] !== 'string') {
                            parts.push(`${value._fieldLabels[key]}: ${String(value[key])}`);
                        }
                    });
                return parts.join(' | ');
            }
            // Handle regular objects by converting to JSON or extracting meaningful fields
            try {
                // Check for common display fields
                if (value.displayText) return String(value.displayText);
                if (value.display) return String(value.display);
                if (value.label) return String(value.label);
                if (value.name) return String(value.name);
                if (value.value !== undefined) return String(value.value);
                // Last resort: JSON stringify (but clean it up)
                const jsonStr = JSON.stringify(value);
                if (jsonStr && jsonStr !== '{}' && jsonStr !== 'null') {
                    return jsonStr;
                }
                return String(value);
            } catch (error) {
                console.warn('Error converting object to string:', error);
                return String(value);
            }
        }
        // Handle primitives (string, number, boolean)
        return String(value);
    }
    // ============================================================================
    // OVERRIDE: Custom validation behavior
    // ============================================================================
    validate() {
        // Custom fields typically don't need validation
        // But we hide any errors and return true for consistency
        this.hideError();
        return true;
    }
    // ============================================================================
    // OVERRIDE: Custom container creation
    // ============================================================================
    createContainer() {
        // Use BaseField's container creation but with custom class
        const container = super.createContainer();
        container.classList.add('custom-field');
        return container;
    }
    // ============================================================================
    // OVERRIDE: Custom render method
    // ============================================================================
    render() {
        const container = this.createContainer();
        // Only create label if explicitly provided
        if (this.label && this.label.trim()) {
            const labelElement = this.createLabel();
            container.appendChild(labelElement);
        }
        // Create content based on configuration
        let contentElement;
        if (this.autoSummary) {
            contentElement = this.createAutoSummary();
        } else if (this.renderFunction) {
            contentElement = this.createCustomContent();
        } else {
            contentElement = this.createEmptyContent();
        }
        container.appendChild(contentElement);
        // Create error element (even though custom fields rarely use it)
        const errorElement = this.createErrorElement();
        container.appendChild(errorElement);
        this.container = container;
        this.element = contentElement; // For consistency with BaseField
        return container;
    }
    // ============================================================================
    // CUSTOM CONTENT CREATION METHODS
    // ============================================================================
    createCustomContent() {
        const wrapper = document.createElement('div');
        wrapper.className = 'custom-content';
        try {
            const customContent = this.renderFunction(this.factory, this.getFormData());
            if (customContent instanceof HTMLElement) {
                wrapper.appendChild(customContent);
            } else if (typeof customContent === 'string') {
                wrapper.innerHTML = customContent;
            }
        } catch (error) {
            console.error('Error rendering custom field:', error);
            wrapper.innerHTML = '<div class="custom-field-error">Error rendering custom content</div>';
        }
        return wrapper;
    }
    createEmptyContent() {
        const wrapper = document.createElement('div');
        wrapper.className = 'custom-content empty';
        wrapper.innerHTML = '<div class="custom-field-placeholder">Custom field content not configured</div>';
        return wrapper;
    }
    createAutoSummary() {
        const multiStepForm = this.factory.currentMultiStepForm;
        if (!multiStepForm) {
            const errorDiv = document.createElement('div');
            errorDiv.className = 'custom-content error';
            errorDiv.textContent = 'No multi-step form found for summary';
            return errorDiv;
        }
        const summaryContainer = document.createElement('div');
        summaryContainer.className = 'summary-container auto-summary';
        const currentStepIndex = multiStepForm.currentStep;
        multiStepForm.steps.forEach((step, stepIndex) => {
            if (stepIndex === currentStepIndex) return;
            const stepData = this.getStepData(multiStepForm, stepIndex);
            if (this.hasVisibleData(stepData, step)) {
                const stepSection = this.createStepSummarySection(step, stepData, stepIndex);
                summaryContainer.appendChild(stepSection);
            }
        });
        return summaryContainer;
    }
    createStepSummarySection(step, stepData, stepIndex) {
        const section = document.createElement('div');
        section.className = 'summary-section';
        section.innerHTML = `
            <div class="summary-heading">
                <span>${step.title}</span>
                <button type="button" class="edit-btn" data-step="${stepIndex}">
                    ${this.factory.getText('edit') || 'Modifier'}
                </button>
            </div>
            <div class="summary-content" id="step-${stepIndex}-summary"></div>
        `;
        const editBtn = section.querySelector('.edit-btn');
        editBtn.addEventListener('click', () => {
            if (this.factory.currentMultiStepForm) {
                this.factory.currentMultiStepForm.goToStep(stepIndex);
            }
        });
        const contentDiv = section.querySelector('.summary-content');
        this.populateStepContent(contentDiv, step, stepData);
        return section;
    }
    /**
     * UPDATED: populateStepContent now properly handles all value types and converts them to strings
     */
    populateStepContent(contentDiv, step, stepData) {
        let contentHtml = '';
        let hasVisibleContent = false;
        step.fields.forEach(fieldConfig => {
            const fieldName = fieldConfig.name || fieldConfig.id;
            const fieldValue = stepData[fieldName];
            if (this.shouldDisplayFieldInSummary(fieldConfig, fieldValue)) {
                hasVisibleContent = true;
                // Special handling for yesno-with-options fields
                if (fieldConfig.type === 'yesno-with-options') {
                    contentHtml += this.renderYesNoWithOptionsField(fieldConfig, fieldValue, stepData);
                } else {
                    // Regular field processing
                    const processedField = this.processor.processFormData({
                        [fieldName]: fieldValue
                    })[fieldName];
                    if (processedField && processedField.displayValue !== undefined && processedField.displayValue !== null) {
                        // FIX: Safely convert displayValue to string
                        let displayValue = this.safeConvertToString(processedField.displayValue);
                        // Skip if display value is empty or indicates indifference
                        if (displayValue && displayValue.trim() !== '' &&
                            !this.isIndifferentValue(displayValue, fieldConfig)) {
                            contentHtml += `
                                <div class="summary-row">
                                    <div class="summary-label">${processedField.label}:</div>
                                    <div class="summary-value">${displayValue}</div>
                                </div>
                            `;
                        }
                    }
                }
            }
        });
        // Only show content if there's meaningful data
        if (hasVisibleContent && contentHtml.trim() !== '') {
            contentDiv.innerHTML = contentHtml;
        } else {
            contentDiv.innerHTML = '<div class="summary-empty">Aucune donnée saisie</div>';
        }
    }
    /**
     * UPDATED: Special rendering for yesno-with-options fields with enhanced filtering
     */
    renderYesNoWithOptionsField(fieldConfig, fieldValue, stepData) {
        let html = '';
        if (!fieldValue || typeof fieldValue !== 'object' || fieldValue.main === undefined) {
            return '';
        }
        // Check if main value is actually answered (not null/undefined)
        if (!this.isYesNoFieldAnswered(fieldValue, fieldConfig)) {
            return '';
        }
        // Get the main field label and display value
        const mainLabel = this.getFieldLabel(fieldConfig);
        const mainDisplayValue = this.formatter.formatYesNoValue(fieldValue.main, fieldConfig);
        // Only show if main display value is meaningful
        if (mainDisplayValue && String(mainDisplayValue)
            .trim() !== '' &&
            !this.isIndifferentValue(mainDisplayValue, fieldConfig)) {
            html += `
                <div class="summary-row">
                    <div class="summary-label">${mainLabel}:</div>
                    <div class="summary-value">${this.safeConvertToString(mainDisplayValue)}</div>
                </div>
            `;
            // Determine which conditional fields to show
            const showYesFields = this.formatter.isYesValue(fieldValue.main, fieldConfig);
            const showNoFields = this.formatter.isNoValue(fieldValue.main, fieldConfig);
            // Show conditional sub-fields
            if (showYesFields && fieldValue.yesValues) {
                const subFieldConfigs = fieldConfig.yesFields || (fieldConfig.yesField ? [fieldConfig.yesField] : []);
                html += this.renderSubFields(subFieldConfigs, fieldValue.yesValues, stepData);
            } else if (showNoFields && fieldValue.noValues) {
                const subFieldConfigs = fieldConfig.noFields || (fieldConfig.noField ? [fieldConfig.noField] : []);
                html += this.renderSubFields(subFieldConfigs, fieldValue.noValues, stepData);
            }
        }
        return html;
    }
    /**
     * UPDATED: Render sub-fields with enhanced indifferent value filtering
     */
    renderSubFields(subFieldConfigs, subFieldValues, stepData) {
        let html = '';
        if (!Array.isArray(subFieldConfigs) || !subFieldValues) {
            return html;
        }
        subFieldConfigs.forEach(subFieldConfig => {
            const fieldName = subFieldConfig.name || subFieldConfig.id;
            const subFieldValue = subFieldValues[fieldName];
            if (this.shouldDisplayFieldInSummary(subFieldConfig, subFieldValue)) {
                const subFieldLabel = this.getSubFieldLabel(subFieldConfig);
                const rawDisplayValue = this.formatter.formatValueDirectly(subFieldConfig, subFieldValue);
                // FIX: Use safe string conversion
                let displayValue = this.safeConvertToString(rawDisplayValue);
                // Only show if display value is meaningful and not indifferent
                if (displayValue && displayValue.trim() !== '' &&
                    !this.isIndifferentValue(displayValue, subFieldConfig)) {
                    html += `
                        <div class="summary-row sub-field">
                            <div class="summary-label">${subFieldLabel}:</div>
                            <div class="summary-value">${displayValue}</div>
                        </div>
                    `;
                }
            }
        });
        return html;
    }
    /**
     * NEW: Get label for sub-fields with proper fallbacks
     */
    getSubFieldLabel(subFieldConfig) {
        // Try multiple ways to get the label
        if (subFieldConfig.label) {
            return subFieldConfig.label;
        }
        // Try to get translated label
        const fieldId = subFieldConfig.id || subFieldConfig.name;
        if (fieldId && this.factory.creatFormInstance) {
            const translatedLabel = this.factory.creatFormInstance.getText(`fields.${fieldId}`);
            if (translatedLabel && translatedLabel !== `fields.${fieldId}`) {
                return translatedLabel;
            }
        }
        // Fallback to field ID
        return fieldId || 'Unknown Field';
    }
    /**
     * UPDATED: Get field label with better fallback handling
     */
    getFieldLabel(fieldConfig) {
        // Try multiple ways to get the label
        if (fieldConfig.label) {
            return fieldConfig.label;
        }
        // Try to get translated label
        const fieldId = fieldConfig.id || fieldConfig.name;
        if (fieldId && this.factory.creatFormInstance) {
            const translatedLabel = this.factory.creatFormInstance.getText(`fields.${fieldId}`);
            if (translatedLabel && translatedLabel !== `fields.${fieldId}`) {
                return translatedLabel;
            }
        }
        // Fallback to field ID
        return fieldId || 'Unknown Field';
    }
    // ============================================================================
    // OVERRIDE: Value handling (custom fields typically don't have values)
    // ============================================================================
    getValue() {
        // Custom fields typically don't have values
        // But return null for consistency
        return null;
    }
    setValue(value) {
        // Custom fields typically don't have settable values
        // But accept the call for consistency
        this.value = value;
    }
    // ============================================================================
    // CUSTOM FIELD SPECIFIC METHODS
    // ============================================================================
    updateContent() {
        if (!this.container) return;
        // Find the content element and update it
        const existingContent = this.container.querySelector('.custom-content, .summary-container');
        if (existingContent) {
            let newContent;
            if (this.autoSummary) {
                newContent = this.createAutoSummary();
            } else if (this.renderFunction) {
                newContent = this.createCustomContent();
            } else {
                newContent = this.createEmptyContent();
            }
            existingContent.replaceWith(newContent);
            this.element = newContent;
        }
    }
    getStepData(multiStepForm, stepIndex) {
        const stepInstance = multiStepForm.stepInstances[stepIndex];
        if (!stepInstance) return {};
        return stepInstance.getStepData();
    }
    /**
     * UPDATED: hasVisibleData now checks for meaningful data using field configurations
     */
    hasVisibleData(stepData, step) {
        if (!step || !step.fields) {
            return Object.values(stepData)
                .some(value =>
                    this.formatter.shouldDisplayValue(value)
                );
        }
        // Check each field with its configuration
        return step.fields.some(fieldConfig => {
            const fieldName = fieldConfig.name || fieldConfig.id;
            const fieldValue = stepData[fieldName];
            return this.shouldDisplayFieldInSummary(fieldConfig, fieldValue);
        });
    }
    getFormData() {
        if (this.factory.currentMultiStepForm) {
            return this.factory.currentMultiStepForm.getFormData();
        }
        return {};
    }
    setStepData(data) {
        if (this.autoSummary) {
            this.updateContent();
        }
    }
    // ============================================================================
    // OVERRIDE: Cleanup to include custom field specific cleanup
    // ============================================================================
    cleanup() {
        super.cleanup(); // Call parent cleanup
        // Custom field specific cleanup
        if (this.processor) {
            // No specific cleanup needed for processor
        }
    }
    // ============================================================================
    // OVERRIDE: Reset behavior for custom fields
    // ============================================================================
    resetToInitial() {
        // Custom fields don't typically reset like input fields
        // But we can refresh the content
        if (this.autoSummary || this.renderFunction) {
            this.updateContent();
        }
        super.resetToInitial();
    }
}
/**
 * SingleSelectWithOtherField - Simple dropdown with "Other" option and personalized error messages
 */
class SingleSelectWithOtherField extends BaseField {
    constructor(factory, config) {
        super(factory, config);
        this.options = config.options || [];
        this.placeholder = config.placeholder || factory.getText('selectPlaceholder');
        this.otherLabel = config.otherLabel || factory.getText('other');
        this.otherPlaceholder = config.otherPlaceholder || `${factory.getText('other')}...`;
        this.otherValue = '';
        this.dropdownInstance = null;
        this.isOpen = false;
    }
    validate() {
        if (this.required) {
            const mainValue = this.element ? this.element.value : '';
            if (!mainValue) {
                this.showError(this.getFieldErrorMessage('required'));
                return false;
            }
            if (mainValue === 'other' && !this.otherValue) {
                if (this.otherError) {
                    this.otherError.classList.add('show');
                }
                return false;
            }
        }
        this.hideError();
        if (this.otherError) {
            this.otherError.classList.remove('show');
        }
        return true;
    }
    render() {
        const container = this.createContainer();
        const label = this.createLabel();
        const optionsWithOther = [...this.options, {
            id: 'other',
            name: this.otherLabel
        }];
        const mainContainer = document.createElement('div');
        mainContainer.className = 'main-container';
        this.element = document.createElement('select');
        this.element.id = this.id;
        this.element.name = this.name;
        this.element.style.display = 'none';
        const defaultOption = document.createElement('option');
        defaultOption.value = '';
        defaultOption.textContent = this.placeholder;
        this.element.appendChild(defaultOption);
        optionsWithOther.forEach(option => {
            const optionElement = document.createElement('option');
            optionElement.value = option.id;
            optionElement.textContent = option.name;
            this.element.appendChild(optionElement);
        });
        const selectWrapper = document.createElement('div');
        selectWrapper.className = 'select-wrapper';
        this.selectDisplayElement = document.createElement('div');
        this.selectDisplayElement.className = 'select-display placeholder';
        this.selectDisplayElement.innerHTML = `
            <span>${this.placeholder}</span>
            <div class="dropdown-icon">
                ${this.factory.SVG_ICONS.CHEVRON}
            </div>
        `;
        this.customOptionsElement = document.createElement('div');
        this.customOptionsElement.className = 'custom-options';
        optionsWithOther.forEach(option => {
            const customOption = document.createElement('div');
            customOption.className = 'custom-option';
            customOption.setAttribute('data-value', option.id);
            customOption.innerHTML = `
                <div class="option-checkbox">
                    ${this.factory.SVG_ICONS.CHECK}
                </div>
                <span>${option.name}</span>
            `;
            customOption.addEventListener('click', (e) => {
                e.stopPropagation();
                this.selectMainOption(option);
            });
            this.customOptionsElement.appendChild(customOption);
        });
        selectWrapper.appendChild(this.selectDisplayElement);
        selectWrapper.appendChild(this.customOptionsElement);
        this.selectDisplayElement.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleDropdown();
        });
        mainContainer.appendChild(this.element);
        mainContainer.appendChild(selectWrapper);
        this.otherContainer = document.createElement('div');
        this.otherContainer.className = 'conditional-field-wrapper';
        this.otherContainer.id = `${this.id}-other-group`;
        this.otherContainer.style.display = 'none';
        this.otherContainer.style.marginTop = '10px'; // Add 10px vertical spacing
        const otherLabel = document.createElement('label');
        otherLabel.className = 'form-label';
        otherLabel.textContent = this.otherLabel;
        this.otherInput = document.createElement('input');
        this.otherInput.type = 'text';
        this.otherInput.id = `${this.id}-other`;
        this.otherInput.placeholder = this.otherPlaceholder;
        this.otherError = document.createElement('div');
        this.otherError.className = 'error-message';
        this.otherError.id = `error-${this.id}-other`;
        this.otherError.innerHTML = `
            <div class="error-icon">!</div>
            <span class="error-text">${this.getFieldErrorMessage('required')}</span>
        `;
        this.otherContainer.appendChild(otherLabel);
        this.otherContainer.appendChild(this.otherInput);
        this.otherContainer.appendChild(this.otherError);
        this.otherInput.addEventListener('input', () => {
            this.otherValue = this.otherInput.value.trim();
            this.value = {
                main: 'other',
                other: this.otherValue
            };
            if (this.otherValue) {
                this.otherError.classList.remove('show');
            }
            this.handleChange();
        });
        const errorElement = this.createErrorElement();
        container.appendChild(label);
        container.appendChild(mainContainer);
        container.appendChild(this.otherContainer);
        container.appendChild(errorElement);
        this.container = container;
        this.selectWrapper = selectWrapper;
        return container;
    }
    selectMainOption(option) {
        this.customOptionsElement.querySelectorAll('.custom-option')
            .forEach(opt => {
                opt.classList.remove('selected');
            });
        const optionElement = this.customOptionsElement.querySelector(`[data-value="${option.id}"]`);
        if (optionElement) {
            optionElement.classList.add('selected');
        }
        this.selectDisplayElement.querySelector('span')
            .textContent = option.name;
        this.selectDisplayElement.classList.remove('placeholder');
        this.element.value = option.id;
        this.closeDropdown();
        if (option.id === 'other') {
            this.otherContainer.style.display = 'block';
            this.value = {
                main: option.id,
                other: this.otherValue
            };
        } else {
            this.otherContainer.style.display = 'none';
            this.value = {
                main: option.id,
                other: ''
            };
            this.otherValue = '';
            if (this.otherInput) this.otherInput.value = '';
        }
        this.hideError();
        this.handleChange();
    }
    toggleDropdown() {
        if (this.isOpen) {
            this.closeDropdown();
        } else {
            this.openDropdown();
        }
    }
    openDropdown() {
        if (this.isOpen) return;
        this.factory.closeAllDropdowns();
        this.customOptionsElement.classList.add('show-options');
        this.selectDisplayElement.querySelector('.dropdown-icon')
            .classList.add('rotate');
        this.isOpen = true;
        this.dropdownInstance = {
            element: this.selectWrapper,
            close: () => this.closeDropdown()
        };
        this.factory.registerDropdown(this.dropdownInstance);
    }
    closeDropdown() {
        if (!this.isOpen) return;
        this.customOptionsElement.classList.remove('show-options');
        this.selectDisplayElement.querySelector('.dropdown-icon')
            .classList.remove('rotate');
        this.isOpen = false;
        if (this.dropdownInstance) {
            this.factory.unregisterDropdown(this.dropdownInstance);
            this.dropdownInstance = null;
        }
    }
    getValue() {
        if (this.value && typeof this.value === 'object') {
            if (this.value.main === 'other' && this.value.other) {
                return this.value.other;
            } else if (this.value.main !== 'other') {
                return this.value.main;
            }
        }
        return this.element ? this.element.value : '';
    }
    setValue(value) {
        const existingOption = this.options.find(opt => opt.id === value);
        if (existingOption) {
            this.selectMainOption(existingOption);
        } else if (value) {
            const otherOption = {
                id: 'other',
                name: this.otherLabel
            };
            this.selectMainOption(otherOption);
            this.otherValue = value;
            if (this.otherInput) {
                this.otherInput.value = value;
            }
            this.value = {
                main: 'other',
                other: value
            };
        }
    }
    setOptions(newOptions) {
        this.options = newOptions || [];
        if (this.container) {
            const currentValue = this.getValue();
            const mainContainer = this.container.querySelector('.main-container');
            if (mainContainer) {
                this.element.innerHTML = '';
                this.customOptionsElement.innerHTML = '';
                const optionsWithOther = [...this.options, {
                    id: 'other',
                    name: this.otherLabel
                }];
                const defaultOption = document.createElement('option');
                defaultOption.value = '';
                defaultOption.textContent = this.placeholder;
                this.element.appendChild(defaultOption);
                optionsWithOther.forEach(option => {
                    const optionElement = document.createElement('option');
                    optionElement.value = option.id;
                    optionElement.textContent = option.name;
                    this.element.appendChild(optionElement);
                    const customOption = document.createElement('div');
                    customOption.className = 'custom-option';
                    customOption.setAttribute('data-value', option.id);
                    customOption.innerHTML = `
                        <div class="option-checkbox">
                            ${this.factory.SVG_ICONS.CHECK}
                        </div>
                        <span>${option.name}</span>
                    `;
                    customOption.addEventListener('click', (e) => {
                        e.stopPropagation();
                        this.selectMainOption(option);
                    });
                    this.customOptionsElement.appendChild(customOption);
                });
                if (currentValue) {
                    this.setValue(currentValue);
                }
            }
        }
    }
    cleanup() {
        this.closeDropdown();
        super.cleanup();
    }
}
/**
 * MultiSelectWithOtherField - Multiple dropdown with "Other" option and personalized error messages
 */
class MultiSelectWithOtherField extends BaseField {
    constructor(factory, config) {
        super(factory, config);
        this.options = config.options || [];
        this.placeholder = config.placeholder || factory.getText('selectMultiplePlaceholder');
        this.otherLabel = config.otherLabel || factory.getText('other');
        this.otherPlaceholder = config.otherPlaceholder || `${factory.getText('other')}...`;
        this.otherValue = '';
        this.selectedValues = [];
        this.dropdownInstance = null;
        this.isOpen = false;
    }
    validate() {
        if (this.required) {
            const hasMainSelection = this.selectedValues.length > 0;
            if (!hasMainSelection) {
                this.showError(this.getFieldErrorMessage('selectAtLeastOne'));
                return false;
            }
            if (this.selectedValues.includes('other') && !this.otherValue) {
                this.otherError.classList.add('show');
                return false;
            }
        }
        this.hideError();
        this.otherError.classList.remove('show');
        return true;
    }
    render() {
        const container = this.createContainer();
        const label = this.createLabel();
        const optionsWithOther = [...this.options, {
            id: 'other',
            name: this.otherLabel
        }];
        const mainContainer = document.createElement('div');
        mainContainer.className = 'main-container';
        this.element = document.createElement('select');
        this.element.id = this.id;
        this.element.name = this.name;
        this.element.multiple = true;
        this.element.style.display = 'none';
        optionsWithOther.forEach(option => {
            const optionElement = document.createElement('option');
            optionElement.value = option.id;
            optionElement.textContent = option.name;
            this.element.appendChild(optionElement);
        });
        const selectWrapper = document.createElement('div');
        selectWrapper.className = 'select-wrapper multi-select';
        this.selectDisplayElement = document.createElement('div');
        this.selectDisplayElement.className = 'select-display placeholder';
        this.selectDisplayElement.innerHTML = `
            <span>${this.placeholder}</span>
            <div class="dropdown-icon">
                ${this.factory.SVG_ICONS.CHEVRON}
            </div>
        `;
        this.customOptionsElement = document.createElement('div');
        this.customOptionsElement.className = 'custom-options multi-select';
        const selectAllOption = document.createElement('div');
        selectAllOption.className = 'custom-option select-all-option';
        selectAllOption.innerHTML = `
            <div class="option-checkbox">
                ${this.factory.SVG_ICONS.CHECK}
            </div>
            <span>${this.factory.getText('selectAll')}</span>
        `;
        selectAllOption.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleSelectAll();
        });
        this.customOptionsElement.appendChild(selectAllOption);
        optionsWithOther.forEach(option => {
            const customOption = document.createElement('div');
            customOption.className = 'custom-option';
            customOption.setAttribute('data-value', option.id);
            customOption.innerHTML = `
                <div class="option-checkbox">
                    ${this.factory.SVG_ICONS.CHECK}
                </div>
                <span>${option.name}</span>
            `;
            customOption.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleMainOption(option, customOption);
            });
            this.customOptionsElement.appendChild(customOption);
        });
        selectWrapper.appendChild(this.selectDisplayElement);
        selectWrapper.appendChild(this.customOptionsElement);
        this.selectDisplayElement.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleDropdown();
        });
        mainContainer.appendChild(this.element);
        mainContainer.appendChild(selectWrapper);
        this.otherContainer = document.createElement('div');
        this.otherContainer.className = 'conditional-field-wrapper';
        this.otherContainer.id = `${this.id}-other-group`;
        this.otherContainer.style.display = 'none';
        this.otherContainer.style.marginTop = '10px'; // Add 10px vertical spacing
        const otherLabel = document.createElement('label');
        otherLabel.className = 'form-label';
        otherLabel.textContent = this.otherLabel;
        this.otherInput = document.createElement('input');
        this.otherInput.type = 'text';
        this.otherInput.id = `${this.id}-other`;
        this.otherInput.placeholder = this.otherPlaceholder;
        this.otherError = document.createElement('div');
        this.otherError.className = 'error-message';
        this.otherError.id = `error-${this.id}-other`;
        this.otherError.innerHTML = `
            <div class="error-icon">!</div>
            <span class="error-text">${this.getFieldErrorMessage('required')}</span>
        `;
        this.otherContainer.appendChild(otherLabel);
        this.otherContainer.appendChild(this.otherInput);
        this.otherContainer.appendChild(this.otherError);
        this.otherInput.addEventListener('input', () => {
            this.otherValue = this.otherInput.value.trim();
            this.value = {
                main: this.selectedValues.filter(v => v !== 'other'),
                other: this.otherValue
            };
            if (this.otherValue) {
                this.otherError.classList.remove('show');
            }
            this.handleChange();
        });
        const errorElement = this.createErrorElement();
        container.appendChild(label);
        container.appendChild(mainContainer);
        container.appendChild(this.otherContainer);
        container.appendChild(errorElement);
        this.container = container;
        this.selectWrapper = selectWrapper;
        return container;
    }
    toggleMainOption(option, customOption) {
        const isSelected = customOption.classList.contains('selected');
        const optElement = this.element.querySelector(`option[value="${option.id}"]`);
        if (isSelected) {
            customOption.classList.remove('selected');
            if (optElement) optElement.selected = false;
            this.selectedValues = this.selectedValues.filter(val => val !== option.id);
        } else {
            customOption.classList.add('selected');
            if (optElement) optElement.selected = true;
            this.selectedValues.push(option.id);
        }
        if (this.selectedValues.includes('other')) {
            this.otherContainer.style.display = 'block';
        } else {
            this.otherContainer.style.display = 'none';
            this.otherValue = '';
            this.otherInput.value = '';
        }
        this.updateDisplayText();
        this.updateSelectAllState();
        this.value = {
            main: this.selectedValues.filter(v => v !== 'other'),
            other: this.selectedValues.includes('other') ? this.otherValue : ''
        };
        this.hideError();
        this.handleChange();
    }
    toggleSelectAll() {
        const allOptions = this.customOptionsElement.querySelectorAll('.custom-option:not(.select-all-option)');
        const selectAllOption = this.customOptionsElement.querySelector('.select-all-option');
        const allSelected = Array.from(allOptions)
            .every(opt => opt.classList.contains('selected'));
        allOptions.forEach(opt => {
            const optValue = opt.dataset.value;
            const optElement = this.element.querySelector(`option[value="${optValue}"]`);
            if (allSelected) {
                opt.classList.remove('selected');
                if (optElement) optElement.selected = false;
            } else {
                opt.classList.add('selected');
                if (optElement) optElement.selected = true;
            }
        });
        if (allSelected) {
            selectAllOption.classList.remove('selected');
            this.selectedValues = [];
            this.otherContainer.style.display = 'none';
            this.otherValue = '';
            this.otherInput.value = '';
        } else {
            selectAllOption.classList.add('selected');
            this.selectedValues = [...this.options.map(opt => opt.id), 'other'];
            this.otherContainer.style.display = 'block';
        }
        this.updateDisplayText();
        this.value = {
            main: this.selectedValues.filter(v => v !== 'other'),
            other: this.selectedValues.includes('other') ? this.otherValue : ''
        };
        this.handleChange();
    }
    updateSelectAllState() {
        const allOptions = this.customOptionsElement.querySelectorAll('.custom-option:not(.select-all-option)');
        const selectAllOption = this.customOptionsElement.querySelector('.select-all-option');
        const allSelected = Array.from(allOptions)
            .every(opt => opt.classList.contains('selected'));
        if (allSelected && this.selectedValues.length > 0) {
            selectAllOption.classList.add('selected');
        } else {
            selectAllOption.classList.remove('selected');
        }
    }
    updateDisplayText() {
        const span = this.selectDisplayElement.querySelector('span');
        if (this.selectedValues.length === 0) {
            span.textContent = this.placeholder;
            this.selectDisplayElement.classList.add('placeholder');
        } else if (this.selectedValues.length === 1) {
            const value = this.selectedValues[0];
            if (value === 'other') {
                span.textContent = this.otherLabel;
            } else {
                const option = this.options.find(opt => opt.id === value);
                span.textContent = option ? option.name : value;
            }
            this.selectDisplayElement.classList.remove('placeholder');
        } else {
            span.textContent = `${this.selectedValues.length} ${this.factory.getText('selected')}`;
            this.selectDisplayElement.classList.remove('placeholder');
        }
    }
    toggleDropdown() {
        if (this.isOpen) {
            this.closeDropdown();
        } else {
            this.openDropdown();
        }
    }
    openDropdown() {
        if (this.isOpen) return;
        this.factory.closeAllDropdowns();
        this.customOptionsElement.classList.add('show-options');
        this.selectDisplayElement.querySelector('.dropdown-icon')
            .classList.add('rotate');
        this.isOpen = true;
        this.dropdownInstance = {
            element: this.selectWrapper,
            close: () => this.closeDropdown()
        };
        this.factory.registerDropdown(this.dropdownInstance);
    }
    closeDropdown() {
        if (!this.isOpen) return;
        this.customOptionsElement.classList.remove('show-options');
        this.selectDisplayElement.querySelector('.dropdown-icon')
            .classList.remove('rotate');
        this.isOpen = false;
        if (this.dropdownInstance) {
            this.factory.unregisterDropdown(this.dropdownInstance);
            this.dropdownInstance = null;
        }
    }
    getValue() {
        const result = [];
        if (this.value && typeof this.value === 'object') {
            if (this.value.main && Array.isArray(this.value.main)) {
                result.push(...this.value.main);
            }
            if (this.value.other) {
                result.push(this.value.other);
            }
        }
        return result;
    }
    setValue(values) {
        if (!Array.isArray(values)) {
            values = values ? [values] : [];
        }
        const existingValues = [];
        let otherValue = '';
        values.forEach(value => {
            const existingOption = this.options.find(opt => opt.id === value);
            if (existingOption) {
                existingValues.push(value);
            } else if (value) {
                otherValue = value;
            }
        });
        this.selectedValues = [...existingValues];
        if (otherValue) {
            this.selectedValues.push('other');
        }
        if (this.element) {
            Array.from(this.element.options)
                .forEach(option => {
                    option.selected = this.selectedValues.includes(option.value);
                });
        }
        if (this.customOptionsElement) {
            this.customOptionsElement.querySelectorAll('.custom-option:not(.select-all-option)')
                .forEach(opt => {
                    if (this.selectedValues.includes(opt.dataset.value)) {
                        opt.classList.add('selected');
                    } else {
                        opt.classList.remove('selected');
                    }
                });
            this.updateSelectAllState();
        }
        if (otherValue) {
            this.otherValue = otherValue;
            this.otherInput.value = otherValue;
            this.otherContainer.style.display = 'block';
        } else {
            this.otherContainer.style.display = 'none';
        }
        this.value = {
            main: existingValues,
            other: otherValue
        };
        if (this.selectDisplayElement) {
            this.updateDisplayText();
        }
    }
    cleanup() {
        this.closeDropdown();
        super.cleanup();
    }
}
/**
 * SlidingWindowRangeField - Optimized with enhanced caching and performance
 */
class SlidingWindowRangeField extends BaseField {
    constructor(factory, config) {
        super(factory, config);
        this.min = config.min || 0;
        this.max = config.max || 10000;
        this.step = config.step || 100;
        this.rangeWindow = config.rangeWindow || 1000;
        this.windowStep = config.windowStep || 1000;
        this.minGap = config.minGap || 100;
        this.formatValue = config.formatValue || ((val) => `${parseInt(val).toLocaleString()}`);
        this.currentMin = config.currentMin || this.min;
        this.currentMax = config.currentMax || Math.min(this.min + this.rangeWindow, this.max);
        this.selectedMin = config.defaultMin || this.currentMin + 200;
        this.selectedMax = config.defaultMax || this.currentMax - 200;
        // Performance optimizations
        this.debounceDelay = config.debounceDelay || 50;
        this.debouncedUpdate = this.debounce(() => this.updateUI(), this.debounceDelay);
        this.debouncedChange = this.debounce(() => this.handleChange(), this.debounceDelay);
        this.positionCache = new Map();
        this.dimensionCache = new Map();
        this.customValidation = config.customValidation || null;
    }
    debounce(func, delay) {
        let timeoutId;
        return (...args) => {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => func.apply(this, args), delay);
        };
    }
    validate() {
        if (this.required && (!this.selectedMin && !this.selectedMax)) {
            this.showError(this.getFieldErrorMessage('required'));
            return false;
        }
        return super.validate();
    }
    validateConstraints(newValue) {
        if (this.customValidation) {
            const result = this.customValidation(newValue, this.factory.formValues);
            if (result !== true) {
                if (typeof result === 'object' && result.adjustedValue !== undefined) {
                    this.selectedMin = result.adjustedValue;
                    this.selectedMax = Math.max(this.selectedMin + this.minGap, this.selectedMax);
                    if (this.minRange && this.maxRange) {
                        this.minRange.value = this.selectedMin;
                        this.maxRange.value = this.selectedMax;
                        this.debouncedUpdate();
                    }
                    this.showError(result.message);
                    return result.adjustedValue;
                } else if (typeof result === 'string') {
                    this.showError(result);
                    return false;
                }
            } else {
                this.hideError();
            }
        }
        return newValue;
    }
    updateConstraints(newConstraints) {
        if (newConstraints.min !== undefined) {
            this.min = newConstraints.min;
            this.currentMin = Math.max(this.currentMin, newConstraints.min);
            if (this.minRange) {
                this.minRange.min = this.currentMin;
                this.maxRange.min = this.currentMin;
                if (this.selectedMin < this.currentMin) {
                    this.selectedMin = this.currentMin;
                    this.minRange.value = this.selectedMin;
                }
                if (this.selectedMax < this.currentMin + this.minGap) {
                    this.selectedMax = this.currentMin + this.minGap;
                    this.maxRange.value = this.selectedMax;
                }
                this.clearCache();
                this.debouncedUpdate();
            }
        }
        if (newConstraints.rangeWindow !== undefined) {
            this.rangeWindow = newConstraints.rangeWindow;
        }
        if (newConstraints.windowStep !== undefined) {
            this.windowStep = newConstraints.windowStep;
        }
    }
    clearCache() {
        this.positionCache.clear();
        this.dimensionCache.clear();
    }
    getContainerDimensions() {
        const container = this.container.querySelector('.range-container');
        if (!container) return {
            width: 0,
            height: 0
        };
        const cacheKey = 'container-dimensions';
        if (this.dimensionCache.has(cacheKey)) {
            return this.dimensionCache.get(cacheKey);
        }
        const dimensions = {
            width: container.offsetWidth,
            height: container.offsetHeight
        };
        this.dimensionCache.set(cacheKey, dimensions);
        return dimensions;
    }
    calculateLabelPosition(percent, labelElement) {
        if (!labelElement) return percent;
        const cacheKey = `label-pos-${percent}-${labelElement.offsetWidth}`;
        if (this.positionCache.has(cacheKey)) {
            return this.positionCache.get(cacheKey);
        }
        const containerDimensions = this.getContainerDimensions();
        if (containerDimensions.width === 0) return percent;
        const labelWidth = labelElement.offsetWidth || 100;
        const leftBoundary = (labelWidth / 2) / containerDimensions.width * 100;
        const rightBoundary = 100 - leftBoundary;
        let result = percent;
        if (percent < leftBoundary) {
            result = leftBoundary;
        } else if (percent > rightBoundary) {
            result = rightBoundary;
        }
        this.positionCache.set(cacheKey, result);
        return result;
    }
    checkLabelCollision(minPercent, maxPercent, minLabel, maxLabel) {
        if (!minLabel || !maxLabel) return {
            minPercent,
            maxPercent
        };
        const cacheKey = `collision-${minPercent}-${maxPercent}-${minLabel.offsetWidth}-${maxLabel.offsetWidth}`;
        if (this.positionCache.has(cacheKey)) {
            return this.positionCache.get(cacheKey);
        }
        const minWidth = minLabel.offsetWidth || 100;
        const maxWidth = maxLabel.offsetWidth || 100;
        const containerDimensions = this.getContainerDimensions();
        if (containerDimensions.width === 0) return {
            minPercent,
            maxPercent
        };
        const minDistance = ((minWidth + maxWidth) / 2 + 10) / containerDimensions.width * 100;
        const currentDistance = maxPercent - minPercent;
        let result = {
            minPercent,
            maxPercent
        };
        if (currentDistance < minDistance) {
            const center = (minPercent + maxPercent) / 2;
            const halfDistance = minDistance / 2;
            let adjustedMinPercent = center - halfDistance;
            let adjustedMaxPercent = center + halfDistance;
            if (adjustedMinPercent < 0) {
                adjustedMinPercent = 0;
                adjustedMaxPercent = minDistance;
            } else if (adjustedMaxPercent > 100) {
                adjustedMaxPercent = 100;
                adjustedMinPercent = 100 - minDistance;
            }
            result = {
                minPercent: adjustedMinPercent,
                maxPercent: adjustedMaxPercent
            };
        }
        this.positionCache.set(cacheKey, result);
        return result;
    }
    calculateTrianglePosition(originalPercent, finalPercent, labelElement, containerElement) {
        if (!labelElement || !containerElement) return '50%';
        const containerWidth = containerElement.offsetWidth;
        const labelWidth = labelElement.offsetWidth;
        if (containerWidth === 0 || labelWidth === 0) return '50%';
        const originalHandlePosition = (originalPercent / 100) * containerWidth;
        const finalLabelPosition = (finalPercent / 100) * containerWidth;
        const offsetFromCenter = originalHandlePosition - finalLabelPosition;
        const triangleOffset = (offsetFromCenter / labelWidth) * 100;
        const trianglePosition = 50 + triangleOffset;
        const triangleHalfWidth = 5;
        const safetyMargin = 4;
        const minSafeDistance = triangleHalfWidth + safetyMargin;
        const minTrianglePos = (minSafeDistance / labelWidth) * 100;
        const maxTrianglePos = 100 - minTrianglePos;
        const absoluteMinPos = Math.max(minTrianglePos, 15);
        const absoluteMaxPos = Math.min(maxTrianglePos, 85);
        return `${Math.max(absoluteMinPos, Math.min(absoluteMaxPos, trianglePosition))}%`;
    }
    updateTrianglePosition(labelElement, originalPercent, finalPercent) {
        if (!labelElement) return;
        const container = this.container.querySelector('.range-container');
        const trianglePos = this.calculateTrianglePosition(originalPercent, finalPercent, labelElement, container);
        labelElement.style.setProperty('--triangle-left', trianglePos);
    }
    render() {
        const container = this.createContainer();
        const label = this.createLabel();
        const slidingLayout = document.createElement('div');
        slidingLayout.className = 'sliding-window-layout';
        this.decreaseBtn = document.createElement('button');
        this.decreaseBtn.type = 'button';
        this.decreaseBtn.className = 'slider-control-btn';
        this.decreaseBtn.innerHTML = this.factory.SVG_ICONS.MINUS;
        const rangeContainer = document.createElement('div');
        rangeContainer.className = 'range-container';
        const trackBg = document.createElement('div');
        trackBg.className = 'slider-track-bg';
        this.track = document.createElement('div');
        this.track.className = 'slider-track';
        trackBg.appendChild(this.track);
        this.minRange = document.createElement('input');
        this.minRange.type = 'range';
        this.minRange.className = 'range-input';
        this.minRange.min = this.currentMin;
        this.minRange.max = this.currentMax;
        this.minRange.value = this.selectedMin;
        this.minRange.step = this.step;
        this.maxRange = document.createElement('input');
        this.maxRange.type = 'range';
        this.maxRange.className = 'range-input';
        this.maxRange.min = this.currentMin;
        this.maxRange.max = this.currentMax;
        this.maxRange.value = this.selectedMax;
        this.maxRange.step = this.step;
        this.minLabel = document.createElement('div');
        this.minLabel.className = 'slider-value-label';
        this.maxLabel = document.createElement('div');
        this.maxLabel.className = 'slider-value-label';
        rangeContainer.appendChild(trackBg);
        rangeContainer.appendChild(this.minRange);
        rangeContainer.appendChild(this.maxRange);
        rangeContainer.appendChild(this.minLabel);
        rangeContainer.appendChild(this.maxLabel);
        this.increaseBtn = document.createElement('button');
        this.increaseBtn.type = 'button';
        this.increaseBtn.className = 'slider-control-btn';
        this.increaseBtn.innerHTML = this.factory.SVG_ICONS.PLUS;
        slidingLayout.appendChild(this.decreaseBtn);
        slidingLayout.appendChild(rangeContainer);
        slidingLayout.appendChild(this.increaseBtn);
        const errorElement = this.createErrorElement();
        container.appendChild(label);
        container.appendChild(slidingLayout);
        container.appendChild(errorElement);
        this.setupEventListeners();
        this.updateUI();
        this.container = container;
        return container;
    }
    setupEventListeners() {
        this.minRange.addEventListener('input', () => this.handleMinChange());
        this.maxRange.addEventListener('input', () => this.handleMaxChange());
        this.decreaseBtn.addEventListener('click', () => this.decreaseRange());
        this.increaseBtn.addEventListener('click', () => this.increaseRange());
        // Clear cache on window resize
        window.addEventListener('resize', () => this.clearCache());
    }
    handleMinChange() {
        const minVal = parseInt(this.minRange.value);
        const maxVal = parseInt(this.maxRange.value);
        if (maxVal - minVal < this.minGap) {
            this.minRange.value = maxVal - this.minGap;
        }
        this.selectedMin = parseInt(this.minRange.value);
        this.selectedMax = parseInt(this.maxRange.value);
        const validatedValue = this.validateConstraints({
            min: this.selectedMin,
            max: this.selectedMax,
            currentMin: this.currentMin,
            currentMax: this.currentMax
        });
        if (validatedValue !== false) {
            this.debouncedUpdate();
            this.debouncedChange();
        }
    }
    handleMaxChange() {
        const minVal = parseInt(this.minRange.value);
        const maxVal = parseInt(this.maxRange.value);
        if (maxVal - minVal < this.minGap) {
            this.maxRange.value = minVal + this.minGap;
        }
        this.selectedMin = parseInt(this.minRange.value);
        this.selectedMax = parseInt(this.maxRange.value);
        const validatedValue = this.validateConstraints({
            min: this.selectedMin,
            max: this.selectedMax,
            currentMin: this.currentMin,
            currentMax: this.currentMax
        });
        if (validatedValue !== false) {
            this.debouncedUpdate();
            this.debouncedChange();
        }
    }
    increaseRange() {
        if (this.currentMax < this.max) {
            this.currentMin = Math.min(this.currentMin + this.windowStep, this.max - this.rangeWindow);
            this.currentMax = Math.min(this.currentMax + this.windowStep, this.max);
            this.updateSliderAttributes();
            this.clearCache();
            this.updateUI();
        }
    }
    decreaseRange() {
        if (this.currentMin > this.min) {
            this.currentMin = Math.max(this.currentMin - this.windowStep, this.min);
            this.currentMax = Math.max(this.currentMax - this.windowStep, this.min + this.rangeWindow);
            this.updateSliderAttributes();
            this.clearCache();
            this.updateUI();
        }
    }
    updateSliderAttributes() {
        this.minRange.min = this.currentMin;
        this.minRange.max = this.currentMax;
        this.maxRange.min = this.currentMin;
        this.maxRange.max = this.currentMax;
        if (this.selectedMin < this.currentMin) this.selectedMin = this.currentMin;
        if (this.selectedMin > this.currentMax) this.selectedMin = this.currentMax - this.minGap;
        if (this.selectedMax > this.currentMax) this.selectedMax = this.currentMax;
        if (this.selectedMax < this.currentMin + this.minGap) this.selectedMax = this.currentMin + this.minGap;
        this.minRange.value = this.selectedMin;
        this.maxRange.value = this.selectedMax;
    }
    updateUI() {
        let minPercent = ((this.selectedMin - this.currentMin) / (this.currentMax - this.currentMin)) * 100;
        let maxPercent = ((this.selectedMax - this.currentMin) / (this.currentMax - this.currentMin)) * 100;
        const originalMinPercent = minPercent;
        const originalMaxPercent = maxPercent;
        this.track.style.left = minPercent + '%';
        this.track.style.width = (maxPercent - minPercent) + '%';
        requestAnimationFrame(() => {
            const boundaryCheckedMin = this.calculateLabelPosition(minPercent, this.minLabel);
            const boundaryCheckedMax = this.calculateLabelPosition(maxPercent, this.maxLabel);
            const {
                minPercent: finalMinPercent,
                maxPercent: finalMaxPercent
            } =
            this.checkLabelCollision(boundaryCheckedMin, boundaryCheckedMax, this.minLabel, this.maxLabel);
            this.minLabel.style.left = finalMinPercent + '%';
            this.maxLabel.style.left = finalMaxPercent + '%';
            this.minLabel.textContent = this.formatValue(this.selectedMin);
            this.maxLabel.textContent = this.formatValue(this.selectedMax);
            this.updateTrianglePosition(this.minLabel, originalMinPercent, finalMinPercent);
            this.updateTrianglePosition(this.maxLabel, originalMaxPercent, finalMaxPercent);
        });
        this.decreaseBtn.disabled = this.currentMin <= this.min;
        this.increaseBtn.disabled = this.currentMax >= this.max;
    }
    getValue() {
        return {
            min: this.selectedMin,
            max: this.selectedMax,
            currentMin: this.currentMin,
            currentMax: this.currentMax
        };
    }
    // ADD THIS METHOD: Returns formatted display value for summary
    getDisplayValue() {
        const formattedMin = this.formatValue(this.selectedMin);
        const formattedMax = this.formatValue(this.selectedMax);
        return `${formattedMin} - ${formattedMax}`;
    }
    setValue(value) {
        if (typeof value === 'object' && value !== null) {
            this.selectedMin = value.min || this.selectedMin;
            this.selectedMax = value.max || this.selectedMax;
            this.currentMin = value.currentMin || this.currentMin;
            this.currentMax = value.currentMax || this.currentMax;
            if (this.minRange) {
                this.updateSliderAttributes();
                this.clearCache();
                this.updateUI();
            }
        }
    }
}
/**
 * Fixed DualRangeField - Added proper dimension caching and label positioning
 */
class DualRangeField extends BaseField {
    constructor(factory, config) {
        super(factory, config);
        this.min = config.min || 0;
        this.max = config.max || 10000;
        this.step = config.step || 100;
        this.minGap = config.minGap || 500;
        this.formatValue = config.formatValue || ((val) => `${parseInt(val).toLocaleString()}`);
        this.selectedMin = config.defaultMin || this.min + 1000;
        this.selectedMax = config.defaultMax || this.max - 1000;
        // Performance optimizations
        this.debounceDelay = config.debounceDelay || 50;
        this.debouncedUpdate = this.debounce(() => this.updateUI(), this.debounceDelay);
        this.debouncedChange = this.debounce(() => this.handleChange(), this.debounceDelay);
        this.positionCache = new Map();
        this.dimensionCache = new Map(); // ADDED: Missing dimension cache
        this.customValidation = config.customValidation || null;
    }
    debounce(func, delay) {
        let timeoutId;
        return (...args) => {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => func.apply(this, args), delay);
        };
    }
    validate() {
        if (this.required && (!this.selectedMin && !this.selectedMax)) {
            this.showError(this.getFieldErrorMessage('required'));
            return false;
        }
        return super.validate();
    }
    validateConstraints(newValue) {
        if (this.customValidation) {
            const result = this.customValidation(newValue, this.factory.formValues);
            if (result !== true) {
                if (typeof result === 'object' && result.adjustedValue !== undefined) {
                    this.selectedMin = result.adjustedValue;
                    this.selectedMax = Math.max(this.selectedMin + this.minGap, this.selectedMax);
                    if (this.minRange && this.maxRange) {
                        this.minRange.value = this.selectedMin;
                        this.maxRange.value = this.selectedMax;
                        this.debouncedUpdate();
                    }
                    this.showError(result.message);
                    return result.adjustedValue;
                } else if (typeof result === 'string') {
                    this.showError(result);
                    return false;
                }
            } else {
                this.hideError();
            }
        }
        return newValue;
    }
    updateConstraints(newConstraints) {
        if (newConstraints.min !== undefined) {
            this.min = newConstraints.min;
            if (this.minRange) {
                this.minRange.min = this.min;
                this.maxRange.min = this.min;
                if (this.selectedMin < this.min) {
                    this.selectedMin = this.min;
                    this.minRange.value = this.selectedMin;
                }
                if (this.selectedMax < this.min + this.minGap) {
                    this.selectedMax = this.min + this.minGap;
                    this.maxRange.value = this.selectedMax;
                }
                this.clearCache();
                this.debouncedUpdate();
            }
        }
        if (newConstraints.max !== undefined) {
            this.max = newConstraints.max;
            if (this.minRange) {
                this.minRange.max = this.max;
                this.maxRange.max = this.max;
                this.clearCache();
                this.debouncedUpdate();
            }
        }
    }
    clearCache() {
        this.positionCache.clear();
        this.dimensionCache.clear(); // ADDED: Clear dimension cache
    }
    // ADDED: Missing getContainerDimensions method
    getContainerDimensions() {
        const container = this.container.querySelector('.slider-container');
        if (!container) return {
            width: 0,
            height: 0
        };
        const cacheKey = 'container-dimensions';
        if (this.dimensionCache.has(cacheKey)) {
            return this.dimensionCache.get(cacheKey);
        }
        const dimensions = {
            width: container.offsetWidth,
            height: container.offsetHeight
        };
        this.dimensionCache.set(cacheKey, dimensions);
        return dimensions;
    }
    // UPDATED: Fixed calculateLabelPosition method
    calculateLabelPosition(percent, labelElement) {
        if (!labelElement) return percent;
        const cacheKey = `label-pos-${percent}-${labelElement.offsetWidth}`;
        if (this.positionCache.has(cacheKey)) {
            return this.positionCache.get(cacheKey);
        }
        const containerDimensions = this.getContainerDimensions();
        if (containerDimensions.width === 0) return percent;
        const labelWidth = labelElement.offsetWidth || 100;
        const leftBoundary = (labelWidth / 2) / containerDimensions.width * 100;
        const rightBoundary = 100 - leftBoundary;
        let result = percent;
        if (percent < leftBoundary) {
            result = leftBoundary;
        } else if (percent > rightBoundary) {
            result = rightBoundary;
        }
        this.positionCache.set(cacheKey, result);
        return result;
    }
    // UPDATED: Enhanced checkLabelCollision method
    checkLabelCollision(minPercent, maxPercent, minLabel, maxLabel) {
        if (!minLabel || !maxLabel) return {
            minPercent,
            maxPercent
        };
        const cacheKey = `collision-${minPercent}-${maxPercent}-${minLabel.offsetWidth}-${maxLabel.offsetWidth}`;
        if (this.positionCache.has(cacheKey)) {
            return this.positionCache.get(cacheKey);
        }
        const minWidth = minLabel.offsetWidth || 100;
        const maxWidth = maxLabel.offsetWidth || 100;
        const containerDimensions = this.getContainerDimensions();
        if (containerDimensions.width === 0) return {
            minPercent,
            maxPercent
        };
        const minDistance = ((minWidth + maxWidth) / 2 + 10) / containerDimensions.width * 100;
        const currentDistance = maxPercent - minPercent;
        let result = {
            minPercent,
            maxPercent
        };
        if (currentDistance < minDistance) {
            const center = (minPercent + maxPercent) / 2;
            const halfDistance = minDistance / 2;
            let adjustedMinPercent = center - halfDistance;
            let adjustedMaxPercent = center + halfDistance;
            if (adjustedMinPercent < 0) {
                adjustedMinPercent = 0;
                adjustedMaxPercent = minDistance;
            } else if (adjustedMaxPercent > 100) {
                adjustedMaxPercent = 100;
                adjustedMinPercent = 100 - minDistance;
            }
            result = {
                minPercent: adjustedMinPercent,
                maxPercent: adjustedMaxPercent
            };
        }
        this.positionCache.set(cacheKey, result);
        return result;
    }
    calculateTrianglePosition(originalPercent, finalPercent, labelElement, containerElement) {
        if (!labelElement || !containerElement) return '50%';
        const containerWidth = containerElement.offsetWidth;
        const labelWidth = labelElement.offsetWidth;
        if (containerWidth === 0 || labelWidth === 0) return '50%';
        const originalHandlePosition = (originalPercent / 100) * containerWidth;
        const finalLabelPosition = (finalPercent / 100) * containerWidth;
        const offsetFromCenter = originalHandlePosition - finalLabelPosition;
        const triangleOffset = (offsetFromCenter / labelWidth) * 100;
        const trianglePosition = 50 + triangleOffset;
        const triangleHalfWidth = 5;
        const safetyMargin = 4;
        const minSafeDistance = triangleHalfWidth + safetyMargin;
        const minTrianglePos = (minSafeDistance / labelWidth) * 100;
        const maxTrianglePos = 100 - minTrianglePos;
        const absoluteMinPos = Math.max(minTrianglePos, 15);
        const absoluteMaxPos = Math.min(maxTrianglePos, 85);
        return `${Math.max(absoluteMinPos, Math.min(absoluteMaxPos, trianglePosition))}%`;
    }
    updateTrianglePosition(labelElement, originalPercent, finalPercent) {
        if (!labelElement) return;
        const container = this.container.querySelector('.slider-container');
        const trianglePos = this.calculateTrianglePosition(originalPercent, finalPercent, labelElement, container);
        labelElement.style.setProperty('--triangle-left', trianglePos);
    }
    render() {
        const container = this.createContainer();
        const label = this.createLabel();
        const sliderContainer = document.createElement('div');
        sliderContainer.className = 'slider-container';
        const trackBg = document.createElement('div');
        trackBg.className = 'slider-track-bg';
        this.progress = document.createElement('div');
        this.progress.className = 'slider-progress';
        trackBg.appendChild(this.progress);
        this.minRange = document.createElement('input');
        this.minRange.type = 'range';
        this.minRange.className = 'range-input';
        this.minRange.min = this.min;
        this.minRange.max = this.max;
        this.minRange.value = this.selectedMin;
        this.minRange.step = this.step;
        this.maxRange = document.createElement('input');
        this.maxRange.type = 'range';
        this.maxRange.className = 'range-input';
        this.maxRange.min = this.min;
        this.maxRange.max = this.max;
        this.maxRange.value = this.selectedMax;
        this.maxRange.step = this.step;
        this.minLabel = document.createElement('div');
        this.minLabel.className = 'slider-value-label';
        this.maxLabel = document.createElement('div');
        this.maxLabel.className = 'slider-value-label';
        sliderContainer.appendChild(trackBg);
        sliderContainer.appendChild(this.minRange);
        sliderContainer.appendChild(this.maxRange);
        sliderContainer.appendChild(this.minLabel);
        sliderContainer.appendChild(this.maxLabel);
        const errorElement = this.createErrorElement();
        container.appendChild(label);
        container.appendChild(sliderContainer);
        container.appendChild(errorElement);
        this.setupEventListeners();
        this.updateUI();
        this.container = container;
        return container;
    }
    setupEventListeners() {
        this.minRange.addEventListener('input', () => this.handleMinChange());
        this.maxRange.addEventListener('input', () => this.handleMaxChange());
        window.addEventListener('resize', () => this.clearCache()); // UPDATED: Clear cache on resize
    }
    handleMinChange() {
        const minVal = parseInt(this.minRange.value);
        const maxVal = parseInt(this.maxRange.value);
        if (maxVal - minVal < this.minGap) {
            this.minRange.value = maxVal - this.minGap;
        }
        this.selectedMin = parseInt(this.minRange.value);
        const validatedValue = this.validateConstraints({
            min: this.selectedMin,
            max: this.selectedMax
        });
        if (validatedValue !== false) {
            this.debouncedUpdate();
            this.debouncedChange();
        }
    }
    handleMaxChange() {
        const minVal = parseInt(this.minRange.value);
        const maxVal = parseInt(this.maxRange.value);
        if (maxVal - minVal < this.minGap) {
            this.maxRange.value = minVal + this.minGap;
        }
        this.selectedMax = parseInt(this.maxRange.value);
        const validatedValue = this.validateConstraints({
            min: this.selectedMin,
            max: this.selectedMax
        });
        if (validatedValue !== false) {
            this.debouncedUpdate();
            this.debouncedChange();
        }
    }
    // UPDATED: Enhanced updateUI method with proper positioning
    updateUI() {
        let minPercent = ((this.selectedMin - this.min) / (this.max - this.min)) * 100;
        let maxPercent = ((this.selectedMax - this.min) / (this.max - this.min)) * 100;
        const originalMinPercent = minPercent;
        const originalMaxPercent = maxPercent;
        this.progress.style.left = minPercent + '%';
        this.progress.style.width = (maxPercent - minPercent) + '%';
        requestAnimationFrame(() => {
            // Force dimension recalculation
            this.clearCache();
            const boundaryCheckedMin = this.calculateLabelPosition(minPercent, this.minLabel);
            const boundaryCheckedMax = this.calculateLabelPosition(maxPercent, this.maxLabel);
            const {
                minPercent: finalMinPercent,
                maxPercent: finalMaxPercent
            } =
            this.checkLabelCollision(boundaryCheckedMin, boundaryCheckedMax, this.minLabel, this.maxLabel);
            this.minLabel.style.left = finalMinPercent + '%';
            this.maxLabel.style.left = finalMaxPercent + '%';
            this.minLabel.textContent = this.formatValue(this.selectedMin);
            this.maxLabel.textContent = this.formatValue(this.selectedMax);
            this.updateTrianglePosition(this.minLabel, originalMinPercent, finalMinPercent);
            this.updateTrianglePosition(this.maxLabel, originalMaxPercent, finalMaxPercent);
        });
    }
    getValue() {
        return {
            min: this.selectedMin,
            max: this.selectedMax
        };
    }
    setValue(value) {
        if (typeof value === 'object' && value !== null) {
            this.selectedMin = value.min || this.selectedMin;
            this.selectedMax = value.max || this.selectedMax;
            if (this.minRange && this.maxRange) {
                this.minRange.value = this.selectedMin;
                this.maxRange.value = this.selectedMax;
                this.clearCache();
                this.updateUI();
            }
        }
    }
}
/**
 * OptionsSliderField - Fixed with proper defaultIndex handling
 */
class OptionsSliderField extends BaseField {
    constructor(factory, config) {
        super(factory, config);
        this.options = config.options || [];
        this.showMarkers = config.showMarkers !== false;
        // FIX: Proper undefined checking for defaultIndex
        this.currentIndex = config.defaultIndex !== undefined ?
            config.defaultIndex :
            Math.floor(this.options.length / 2);
        this.value = this.getCurrentValue();
        // Performance optimizations
        this.debounceDelay = config.debounceDelay || 50;
        this.debouncedUpdate = this.debounce(() => this.updateUI(), this.debounceDelay);
        this.debouncedChange = this.debounce(() => this.handleChange(), this.debounceDelay);
        this.positionCache = new Map();
        this.dimensionCache = new Map();
        this.customValidation = config.customValidation || null;
    }
    debounce(func, delay) {
        let timeoutId;
        return (...args) => {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => func.apply(this, args), delay);
        };
    }
    validate() {
        if (this.required && (this.value === undefined || this.value === null || this.value === '')) {
            this.showError(this.getFieldErrorMessage('required'));
            return false;
        }
        return super.validate();
    }
    getCurrentValue() {
        if (this.currentIndex >= 0 && this.currentIndex < this.options.length) {
            const option = this.options[this.currentIndex];
            return typeof option === 'object' ? option.value : option;
        }
        return '';
    }
    getCurrentDisplay() {
        if (this.currentIndex >= 0 && this.currentIndex < this.options.length) {
            const option = this.options[this.currentIndex];
            return typeof option === 'object' ? (option.display || option.label || option.value) : option;
        }
        return '';
    }
    validateConstraints(newValue) {
        if (this.customValidation) {
            const result = this.customValidation(newValue, this.factory.formValues);
            if (result !== true) {
                if (typeof result === 'object' && result.adjustedValue !== undefined) {
                    const adjustedIndex = this.options.findIndex(opt =>
                        (typeof opt === 'object' ? opt.value : opt) === result.adjustedValue
                    );
                    if (adjustedIndex !== -1) {
                        this.currentIndex = adjustedIndex;
                        this.value = result.adjustedValue;
                        if (this.slider) {
                            this.slider.value = this.currentIndex;
                            this.debouncedUpdate();
                        }
                    }
                    this.showError(result.message);
                    return result.adjustedValue;
                } else if (typeof result === 'string') {
                    this.showError(result);
                    return false;
                }
            } else {
                this.hideError();
            }
        }
        return newValue;
    }
    updateConstraints(newConstraints) {
        if (newConstraints.options !== undefined) {
            this.options = newConstraints.options;
            if (this.currentIndex >= this.options.length) {
                this.currentIndex = this.options.length - 1;
            }
            if (this.slider) {
                this.slider.max = this.options.length - 1;
                this.slider.value = this.currentIndex;
                this.value = this.getCurrentValue();
                if (this.showMarkers && this.markersContainer) {
                    this.createMarkers();
                }
                this.clearCache();
                this.debouncedUpdate();
            }
        }
    }
    clearCache() {
        this.positionCache.clear();
        this.dimensionCache.clear();
    }
    getContainerDimensions() {
        const container = this.container.querySelector('.slider-container');
        if (!container) return {
            width: 0,
            height: 0
        };
        const cacheKey = 'container-dimensions';
        if (this.dimensionCache.has(cacheKey)) {
            return this.dimensionCache.get(cacheKey);
        }
        const dimensions = {
            width: container.offsetWidth,
            height: container.offsetHeight
        };
        this.dimensionCache.set(cacheKey, dimensions);
        return dimensions;
    }
    calculateLabelPosition(percent, labelElement) {
        if (!labelElement) return percent;
        const cacheKey = `label-pos-${percent}-${labelElement.offsetWidth}`;
        if (this.positionCache.has(cacheKey)) {
            return this.positionCache.get(cacheKey);
        }
        const containerDimensions = this.getContainerDimensions();
        if (containerDimensions.width === 0) return percent;
        const labelWidth = labelElement.offsetWidth || 100;
        const leftBoundary = (labelWidth / 2) / containerDimensions.width * 100;
        const rightBoundary = 100 - leftBoundary;
        let result = percent;
        if (percent < leftBoundary) {
            result = leftBoundary;
        } else if (percent > rightBoundary) {
            result = rightBoundary;
        }
        this.positionCache.set(cacheKey, result);
        return result;
    }
    checkLabelCollision(minPercent, maxPercent, minLabel, maxLabel) {
        return {
            minPercent,
            maxPercent
        };
    }
    calculateTrianglePosition(originalPercent, finalPercent, labelElement, containerElement) {
        if (!labelElement || !containerElement) return '50%';
        const containerWidth = containerElement.offsetWidth;
        const labelWidth = labelElement.offsetWidth;
        if (containerWidth === 0 || labelWidth === 0) return '50%';
        const originalHandlePosition = (originalPercent / 100) * containerWidth;
        const finalLabelPosition = (finalPercent / 100) * containerWidth;
        const offsetFromCenter = originalHandlePosition - finalLabelPosition;
        const triangleOffset = (offsetFromCenter / labelWidth) * 100;
        const trianglePosition = 50 + triangleOffset;
        const triangleHalfWidth = 5;
        const safetyMargin = 4;
        const minSafeDistance = triangleHalfWidth + safetyMargin;
        const minTrianglePos = (minSafeDistance / labelWidth) * 100;
        const maxTrianglePos = 100 - minTrianglePos;
        const absoluteMinPos = Math.max(minTrianglePos, 15);
        const absoluteMaxPos = Math.min(maxTrianglePos, 85);
        return `${Math.max(absoluteMinPos, Math.min(absoluteMaxPos, trianglePosition))}%`;
    }
    updateTrianglePosition(labelElement, originalPercent, finalPercent) {
        if (!labelElement) return;
        const container = this.container.querySelector('.slider-container');
        const trianglePos = this.calculateTrianglePosition(originalPercent, finalPercent, labelElement, container);
        labelElement.style.setProperty('--triangle-left', trianglePos);
    }
    render() {
        const container = this.createContainer();
        const label = this.createLabel();
        const sliderContainer = document.createElement('div');
        sliderContainer.className = 'slider-container';
        if (this.showMarkers) {
            this.markersContainer = document.createElement('div');
            this.markersContainer.className = 'slider-markers';
            this.createMarkers();
            sliderContainer.appendChild(this.markersContainer);
        }
        const trackBg = document.createElement('div');
        trackBg.className = 'slider-track-bg';
        this.progress = document.createElement('div');
        this.progress.className = 'slider-progress';
        trackBg.appendChild(this.progress);
        this.slider = document.createElement('input');
        this.slider.type = 'range';
        this.slider.className = 'range-input';
        this.slider.id = this.id;
        this.slider.min = 0;
        this.slider.max = this.options.length - 1;
        this.slider.value = this.currentIndex;
        this.slider.step = 1;
        this.valueLabel = document.createElement('div');
        this.valueLabel.className = 'slider-value-label';
        sliderContainer.appendChild(trackBg);
        sliderContainer.appendChild(this.slider);
        sliderContainer.appendChild(this.valueLabel);
        const errorElement = this.createErrorElement();
        container.appendChild(label);
        container.appendChild(sliderContainer);
        container.appendChild(errorElement);
        this.setupEventListeners();
        this.updateUI();
        this.container = container;
        return container;
    }
    createMarkers() {
        this.markersContainer.innerHTML = '';
        this.options.forEach((option, index) => {
            const marker = document.createElement('div');
            marker.className = 'slider-marker';
            marker.dataset.index = index;
            const display = typeof option === 'object' ? (option.display || option.label || option.value) : option;
            marker.textContent = display;
            marker.addEventListener('click', () => {
                const newValue = typeof option === 'object' ? option.value : option;
                const validatedValue = this.validateConstraints(newValue);
                if (validatedValue !== false) {
                    this.currentIndex = index;
                    this.value = this.getCurrentValue();
                    this.slider.value = index;
                    this.debouncedUpdate();
                    this.debouncedChange();
                }
            });
            this.markersContainer.appendChild(marker);
        });
    }
    setupEventListeners() {
        this.slider.addEventListener('input', () => {
            this.currentIndex = parseInt(this.slider.value);
            const newValue = this.getCurrentValue();
            const validatedValue = this.validateConstraints(newValue);
            if (validatedValue !== false) {
                this.value = validatedValue;
                this.debouncedUpdate();
                this.debouncedChange();
            }
        });
        window.addEventListener('resize', () => this.clearCache());
    }
    updateUI() {
        const percent = this.options.length > 1 ? (this.currentIndex / (this.options.length - 1)) * 100 : 0;
        const originalPercent = percent;
        this.progress.style.width = percent + '%';
        requestAnimationFrame(() => {
            this.clearCache();
            const finalPercent = this.calculateLabelPosition(percent, this.valueLabel);
            this.valueLabel.style.left = finalPercent + '%';
            this.valueLabel.textContent = this.getCurrentDisplay();
            this.updateTrianglePosition(this.valueLabel, originalPercent, finalPercent);
        });
        if (this.showMarkers && this.markersContainer) {
            this.markersContainer.querySelectorAll('.slider-marker')
                .forEach((marker, index) => {
                    marker.classList.toggle('active', index === this.currentIndex);
                });
        }
    }
    getValue() {
        return this.value;
    }
    setValue(value) {
        const index = this.options.findIndex(opt =>
            (typeof opt === 'object' ? opt.value : opt) === value
        );
        if (index !== -1) {
            this.currentIndex = index;
            this.value = value;
            if (this.slider) {
                this.slider.value = index;
                this.clearCache();
                this.updateUI();
            }
        }
    }
}
/**
 * SliderField - Fixed with proper defaultValue handling
 */
class SliderField extends BaseField {
    constructor(factory, config) {
        super(factory, config);
        this.min = config.min || 0;
        this.max = config.max || 10000;
        this.step = config.step || 100;
        this.sliderType = config.sliderType || 'currency';
        this.formatValue = config.formatValue || this.getDefaultFormatter();
        // FIX: Proper undefined checking for value/defaultValue
        this.value = config.value !== undefined ?
            config.value :
            (config.defaultValue !== undefined ?
                config.defaultValue :
                (this.min + this.max) / 2);
        // Performance optimizations
        this.debounceDelay = config.debounceDelay || 50;
        this.debouncedUpdate = this.debounce(() => this.updateUI(), this.debounceDelay);
        this.debouncedChange = this.debounce(() => this.handleChange(), this.debounceDelay);
        this.positionCache = new Map();
        this.dimensionCache = new Map();
        this.customValidation = config.customValidation || null;
    }
    debounce(func, delay) {
        let timeoutId;
        return (...args) => {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => func.apply(this, args), delay);
        };
    }
    validate() {
        if (this.required && (this.value === null || this.value === undefined || this.value === '')) {
            this.showError(this.getFieldErrorMessage('required'));
            return false;
        }
        return super.validate();
    }
    getDefaultFormatter() {
        switch (this.sliderType) {
        case 'currency':
            return (val) => `${parseInt(val).toLocaleString()}`;
        case 'percentage':
            return (val) => `${parseFloat(val).toFixed(1)}%`;
        case 'number':
        default:
            return (val) => val.toString();
        }
    }
    validateConstraints(newValue) {
        if (this.customValidation) {
            const result = this.customValidation(newValue, this.factory.formValues);
            if (result !== true) {
                if (typeof result === 'object' && result.adjustedValue !== undefined) {
                    this.value = result.adjustedValue;
                    if (this.slider) {
                        this.slider.value = this.value;
                        this.debouncedUpdate();
                    }
                    this.showError(result.message);
                    return result.adjustedValue;
                } else if (typeof result === 'string') {
                    this.showError(result);
                    return false;
                }
            } else {
                this.hideError();
            }
        }
        return newValue;
    }
    updateConstraints(newConstraints) {
        if (newConstraints.min !== undefined) {
            this.min = newConstraints.min;
            if (this.slider) {
                this.slider.min = this.min;
                if (this.value < this.min) {
                    this.value = this.min;
                    this.slider.value = this.value;
                }
                this.clearCache();
                this.debouncedUpdate();
            }
        }
        if (newConstraints.max !== undefined) {
            this.max = newConstraints.max;
            if (this.slider) {
                this.slider.max = this.max;
                if (this.value > this.max) {
                    this.value = this.max;
                    this.slider.value = this.value;
                }
                this.clearCache();
                this.debouncedUpdate();
            }
        }
    }
    clearCache() {
        this.positionCache.clear();
        this.dimensionCache.clear();
    }
    getContainerDimensions() {
        const container = this.container.querySelector('.slider-container');
        if (!container) return {
            width: 0,
            height: 0
        };
        const cacheKey = 'container-dimensions';
        if (this.dimensionCache.has(cacheKey)) {
            return this.dimensionCache.get(cacheKey);
        }
        const dimensions = {
            width: container.offsetWidth,
            height: container.offsetHeight
        };
        this.dimensionCache.set(cacheKey, dimensions);
        return dimensions;
    }
    calculateLabelPosition(percent, labelElement) {
        if (!labelElement) return percent;
        const cacheKey = `label-pos-${percent}-${labelElement.offsetWidth}`;
        if (this.positionCache.has(cacheKey)) {
            return this.positionCache.get(cacheKey);
        }
        const containerDimensions = this.getContainerDimensions();
        if (containerDimensions.width === 0) return percent;
        const labelWidth = labelElement.offsetWidth || 100;
        const leftBoundary = (labelWidth / 2) / containerDimensions.width * 100;
        const rightBoundary = 100 - leftBoundary;
        let result = percent;
        if (percent < leftBoundary) {
            result = leftBoundary;
        } else if (percent > rightBoundary) {
            result = rightBoundary;
        }
        this.positionCache.set(cacheKey, result);
        return result;
    }
    calculateTrianglePosition(originalPercent, finalPercent, labelElement, containerElement) {
        if (!labelElement || !containerElement) return '50%';
        const containerWidth = containerElement.offsetWidth;
        const labelWidth = labelElement.offsetWidth;
        if (containerWidth === 0 || labelWidth === 0) return '50%';
        const originalHandlePosition = (originalPercent / 100) * containerWidth;
        const finalLabelPosition = (finalPercent / 100) * containerWidth;
        const offsetFromCenter = originalHandlePosition - finalLabelPosition;
        const triangleOffset = (offsetFromCenter / labelWidth) * 100;
        const trianglePosition = 50 + triangleOffset;
        const triangleHalfWidth = 5;
        const safetyMargin = 4;
        const minSafeDistance = triangleHalfWidth + safetyMargin;
        const minTrianglePos = (minSafeDistance / labelWidth) * 100;
        const maxTrianglePos = 100 - minTrianglePos;
        const absoluteMinPos = Math.max(minTrianglePos, 15);
        const absoluteMaxPos = Math.min(maxTrianglePos, 85);
        return `${Math.max(absoluteMinPos, Math.min(absoluteMaxPos, trianglePosition))}%`;
    }
    updateTrianglePosition(labelElement, originalPercent, finalPercent) {
        if (!labelElement) return;
        const container = this.container.querySelector('.slider-container');
        const trianglePos = this.calculateTrianglePosition(originalPercent, finalPercent, labelElement, container);
        labelElement.style.setProperty('--triangle-left', trianglePos);
    }
    render() {
        const container = this.createContainer();
        const label = this.createLabel();
        const sliderContainer = document.createElement('div');
        sliderContainer.className = 'slider-container';
        const trackBg = document.createElement('div');
        trackBg.className = 'slider-track-bg';
        this.progress = document.createElement('div');
        this.progress.className = 'slider-progress';
        trackBg.appendChild(this.progress);
        this.slider = document.createElement('input');
        this.slider.type = 'range';
        this.slider.className = 'range-input';
        this.slider.id = this.id;
        this.slider.min = this.min;
        this.slider.max = this.max;
        this.slider.value = this.value;
        this.slider.step = this.step;
        this.valueLabel = document.createElement('div');
        this.valueLabel.className = 'slider-value-label';
        sliderContainer.appendChild(trackBg);
        sliderContainer.appendChild(this.slider);
        sliderContainer.appendChild(this.valueLabel);
        const errorElement = this.createErrorElement();
        container.appendChild(label);
        container.appendChild(sliderContainer);
        container.appendChild(errorElement);
        this.setupEventListeners();
        this.updateUI();
        this.container = container;
        return container;
    }
    setupEventListeners() {
        this.slider.addEventListener('input', () => {
            const newValue = parseFloat(this.slider.value);
            const validatedValue = this.validateConstraints(newValue);
            if (validatedValue !== false) {
                this.value = validatedValue;
                this.debouncedUpdate();
                this.debouncedChange();
            }
        });
        window.addEventListener('resize', () => this.clearCache());
    }
    updateUI() {
        const percent = ((this.value - this.min) / (this.max - this.min)) * 100;
        const originalPercent = percent;
        this.progress.style.width = percent + '%';
        requestAnimationFrame(() => {
            this.clearCache();
            const finalPercent = this.calculateLabelPosition(percent, this.valueLabel);
            this.valueLabel.style.left = finalPercent + '%';
            this.valueLabel.textContent = this.formatValue(this.value);
            this.updateTrianglePosition(this.valueLabel, originalPercent, finalPercent);
        });
    }
    getValue() {
        return this.value;
    }
    setValue(value) {
        this.value = parseFloat(value) || this.min;
        if (this.slider) {
            this.slider.value = this.value;
            this.clearCache();
            this.updateUI();
        }
    }
}
/**
 * SlidingWindowSliderField - Fixed with proper defaultValue handling
 */
class SlidingWindowSliderField extends BaseField {
    constructor(factory, config) {
        super(factory, config);
        this.min = config.min || 0;
        this.max = config.max || 10000;
        this.step = config.step || 100;
        this.rangeWindow = config.rangeWindow || 1000;
        this.windowStep = config.windowStep || 1000;
        this.formatValue = config.formatValue || ((val) => `${parseInt(val).toLocaleString()}`);
        this.currentMin = config.currentMin || this.min;
        this.currentMax = config.currentMax || Math.min(this.min + this.rangeWindow, this.max);
        // FIX: Proper undefined checking for defaultValue
        this.selectedValue = config.defaultValue !== undefined ?
            config.defaultValue :
            (config.value !== undefined ?
                config.value :
                ((this.currentMin + this.currentMax) / 2));
        if (this.selectedValue < this.currentMin) {
            this.selectedValue = this.currentMin;
        } else if (this.selectedValue > this.currentMax) {
            this.selectedValue = this.currentMax;
        }
        this.value = this.selectedValue;
        // Performance optimizations
        this.debounceDelay = config.debounceDelay || 50;
        this.debouncedUpdate = this.debounce(() => this.updateUI(), this.debounceDelay);
        this.debouncedChange = this.debounce(() => this.handleChange(), this.debounceDelay);
        this.positionCache = new Map();
        this.dimensionCache = new Map();
        this.customValidation = config.customValidation || null;
    }
    debounce(func, delay) {
        let timeoutId;
        return (...args) => {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => func.apply(this, args), delay);
        };
    }
    validate() {
        if (this.required && (this.selectedValue === null || this.selectedValue === undefined || this.selectedValue === '')) {
            this.showError(this.getFieldErrorMessage('required'));
            return false;
        }
        return super.validate();
    }
    validateConstraints(newValue) {
        if (this.customValidation) {
            const result = this.customValidation(newValue, this.factory.formValues);
            if (result !== true) {
                if (typeof result === 'object' && result.adjustedValue !== undefined) {
                    this.selectedValue = result.adjustedValue;
                    this.value = result.adjustedValue;
                    if (this.slider) {
                        this.slider.value = this.selectedValue;
                        this.debouncedUpdate();
                    }
                    this.showError(result.message);
                    return result.adjustedValue;
                } else if (typeof result === 'string') {
                    this.showError(result);
                    return false;
                }
            } else {
                this.hideError();
            }
        }
        return newValue;
    }
    updateConstraints(newConstraints) {
        if (newConstraints.min !== undefined) {
            this.min = newConstraints.min;
            this.currentMin = Math.max(this.currentMin, newConstraints.min);
            if (this.slider) {
                this.slider.min = this.currentMin;
                if (this.selectedValue < this.currentMin) {
                    this.selectedValue = this.currentMin;
                    this.value = this.selectedValue;
                    this.slider.value = this.selectedValue;
                }
                this.clearCache();
                this.debouncedUpdate();
            }
        }
        if (newConstraints.rangeWindow !== undefined) {
            this.rangeWindow = newConstraints.rangeWindow;
        }
        if (newConstraints.windowStep !== undefined) {
            this.windowStep = newConstraints.windowStep;
        }
    }
    clearCache() {
        this.positionCache.clear();
        this.dimensionCache.clear();
    }
    getContainerDimensions() {
        const container = this.container.querySelector('.slider-container');
        if (!container) return {
            width: 0,
            height: 0
        };
        const cacheKey = 'container-dimensions';
        if (this.dimensionCache.has(cacheKey)) {
            return this.dimensionCache.get(cacheKey);
        }
        const dimensions = {
            width: container.offsetWidth,
            height: container.offsetHeight
        };
        this.dimensionCache.set(cacheKey, dimensions);
        return dimensions;
    }
    calculateLabelPosition(percent, labelElement) {
        if (!labelElement) return percent;
        const cacheKey = `label-pos-${percent}-${labelElement.offsetWidth}`;
        if (this.positionCache.has(cacheKey)) {
            return this.positionCache.get(cacheKey);
        }
        const containerDimensions = this.getContainerDimensions();
        if (containerDimensions.width === 0) return percent;
        const labelWidth = labelElement.offsetWidth || 100;
        const leftBoundary = (labelWidth / 2) / containerDimensions.width * 100;
        const rightBoundary = 100 - leftBoundary;
        let result = percent;
        if (percent < leftBoundary) {
            result = leftBoundary;
        } else if (percent > rightBoundary) {
            result = rightBoundary;
        }
        this.positionCache.set(cacheKey, result);
        return result;
    }
    calculateTrianglePosition(originalPercent, finalPercent, labelElement, containerElement) {
        if (!labelElement || !containerElement) return '50%';
        const containerWidth = containerElement.offsetWidth;
        const labelWidth = labelElement.offsetWidth;
        if (containerWidth === 0 || labelWidth === 0) return '50%';
        const originalHandlePosition = (originalPercent / 100) * containerWidth;
        const finalLabelPosition = (finalPercent / 100) * containerWidth;
        const offsetFromCenter = originalHandlePosition - finalLabelPosition;
        const triangleOffset = (offsetFromCenter / labelWidth) * 100;
        const trianglePosition = 50 + triangleOffset;
        const triangleHalfWidth = 5;
        const safetyMargin = 4;
        const minSafeDistance = triangleHalfWidth + safetyMargin;
        const minTrianglePos = (minSafeDistance / labelWidth) * 100;
        const maxTrianglePos = 100 - minTrianglePos;
        const absoluteMinPos = Math.max(minTrianglePos, 15);
        const absoluteMaxPos = Math.min(maxTrianglePos, 85);
        return `${Math.max(absoluteMinPos, Math.min(absoluteMaxPos, trianglePosition))}%`;
    }
    updateTrianglePosition(labelElement, originalPercent, finalPercent) {
        if (!labelElement) return;
        const container = this.container.querySelector('.slider-container');
        const trianglePos = this.calculateTrianglePosition(originalPercent, finalPercent, labelElement, container);
        labelElement.style.setProperty('--triangle-left', trianglePos);
    }
    render() {
        const container = this.createContainer();
        const label = this.createLabel();
        const slidingLayout = document.createElement('div');
        slidingLayout.className = 'sliding-window-layout';
        this.decreaseBtn = document.createElement('button');
        this.decreaseBtn.type = 'button';
        this.decreaseBtn.className = 'slider-control-btn';
        this.decreaseBtn.innerHTML = this.factory.SVG_ICONS.MINUS;
        const sliderContainer = document.createElement('div');
        sliderContainer.className = 'slider-container';
        const trackBg = document.createElement('div');
        trackBg.className = 'slider-track-bg';
        this.progress = document.createElement('div');
        this.progress.className = 'slider-progress';
        trackBg.appendChild(this.progress);
        this.slider = document.createElement('input');
        this.slider.type = 'range';
        this.slider.className = 'range-input';
        this.slider.id = this.id;
        this.slider.min = this.currentMin;
        this.slider.max = this.currentMax;
        this.slider.value = this.selectedValue;
        this.slider.step = this.step;
        this.valueLabel = document.createElement('div');
        this.valueLabel.className = 'slider-value-label';
        sliderContainer.appendChild(trackBg);
        sliderContainer.appendChild(this.slider);
        sliderContainer.appendChild(this.valueLabel);
        this.increaseBtn = document.createElement('button');
        this.increaseBtn.type = 'button';
        this.increaseBtn.className = 'slider-control-btn';
        this.increaseBtn.innerHTML = this.factory.SVG_ICONS.PLUS;
        slidingLayout.appendChild(this.decreaseBtn);
        slidingLayout.appendChild(sliderContainer);
        slidingLayout.appendChild(this.increaseBtn);
        const errorElement = this.createErrorElement();
        container.appendChild(label);
        container.appendChild(slidingLayout);
        container.appendChild(errorElement);
        this.setupEventListeners();
        this.updateUI();
        this.container = container;
        return container;
    }
    setupEventListeners() {
        this.slider.addEventListener('input', () => this.handleValueChange());
        this.decreaseBtn.addEventListener('click', () => this.decreaseRange());
        this.increaseBtn.addEventListener('click', () => this.increaseRange());
        window.addEventListener('resize', () => this.clearCache());
    }
    handleValueChange() {
        const newValue = parseFloat(this.slider.value);
        const validatedValue = this.validateConstraints(newValue);
        if (validatedValue !== false) {
            this.selectedValue = validatedValue;
            this.value = validatedValue;
            this.debouncedUpdate();
            this.debouncedChange();
        }
    }
    increaseRange() {
        if (this.currentMax < this.max) {
            this.currentMin = Math.min(this.currentMin + this.windowStep, this.max - this.rangeWindow);
            this.currentMax = Math.min(this.currentMax + this.windowStep, this.max);
            this.updateSliderAttributes();
            this.clearCache();
            this.updateUI();
        }
    }
    decreaseRange() {
        if (this.currentMin > this.min) {
            this.currentMin = Math.max(this.currentMin - this.windowStep, this.min);
            this.currentMax = Math.max(this.currentMax - this.windowStep, this.min + this.rangeWindow);
            this.updateSliderAttributes();
            this.clearCache();
            this.updateUI();
        }
    }
    updateSliderAttributes() {
        this.slider.min = this.currentMin;
        this.slider.max = this.currentMax;
        if (this.selectedValue < this.currentMin) {
            this.selectedValue = this.currentMin;
        } else if (this.selectedValue > this.currentMax) {
            this.selectedValue = this.currentMax;
        }
        this.slider.value = this.selectedValue;
        this.value = this.selectedValue;
    }
    updateUI() {
        const percent = ((this.selectedValue - this.currentMin) / (this.currentMax - this.currentMin)) * 100;
        const originalPercent = percent;
        this.progress.style.width = percent + '%';
        requestAnimationFrame(() => {
            this.clearCache();
            const finalPercent = this.calculateLabelPosition(percent, this.valueLabel);
            this.valueLabel.style.left = finalPercent + '%';
            this.valueLabel.textContent = this.formatValue(this.selectedValue);
            this.updateTrianglePosition(this.valueLabel, originalPercent, finalPercent);
        });
        this.decreaseBtn.disabled = this.currentMin <= this.min;
        this.increaseBtn.disabled = this.currentMax >= this.max;
    }
    getValue() {
        return this.selectedValue;
    }
    setValue(value) {
        if (typeof value === 'object' && value !== null) {
            this.selectedValue = value.value || value.selectedValue || value.min || this.selectedValue;
            this.currentMin = value.currentMin || this.currentMin;
            this.currentMax = value.currentMax || this.currentMax;
        } else {
            this.selectedValue = parseFloat(value) || this.selectedValue;
        }
        this.value = this.selectedValue;
        if (this.slider) {
            this.updateSliderAttributes();
            this.clearCache();
            this.updateUI();
        }
    }
}
// ============================================================================
// SERVICE CARD FIELD CLASS WITH PERSONALIZED ERROR MESSAGES
// ============================================================================
class ServiceCardField extends BaseField {
    constructor(factory, config) {
        super(factory, config);
        // Store config for later use
        this.config = config;
        // Service card specific config
        this.services = config.services || [];
        this.layout = config.layout || 'grid';
        this.columns = config.columns || 'auto';
        this.showDuration = config.showDuration !== false;
        this.showDescription = config.showDescription !== false;
        this.allowDeselect = config.allowDeselect || false;
        this.selectionMode = config.selectionMode || 'single';
        // State
        this.selectedServices = [];
        this.selectedService = null;
    }
    validate() {
        const hasSelection = this.selectionMode === 'single' ?
            this.selectedService !== null :
            this.selectedServices.length > 0;
        const isValid = !this.required || hasSelection;
        if (!isValid) {
            this.showError(this.getFieldErrorMessage('serviceRequired'));
        } else {
            this.hideError();
        }
        return isValid;
    }
    render() {
        this.element = document.createElement('div');
        this.element.className = `form-field service-card-field layout-${this.layout}`;
        const container = document.createElement('div');
        container.className = `service-cards-container columns-${this.columns}`;
        container.id = this.id;
        // Render each service card
        this.services.forEach((service, index) => {
            const card = this.renderServiceCard(service, index);
            container.appendChild(card);
        });
        this.element.appendChild(container);
        // Add error container
        if (this.required) {
            const errorContainer = document.createElement('div');
            errorContainer.className = 'error-container';
            errorContainer.innerHTML = `
                <div class="error-message" id="${this.id}-error">
                    <div class="error-icon">!</div>
                    <span class="error-text">${this.getFieldErrorMessage('serviceRequired')}</span>
                </div>
            `;
            this.element.appendChild(errorContainer);
        }
        return this.element;
    }
    renderServiceCard(service, index) {
        const card = document.createElement('div');
        card.className = 'service-card';
        card.dataset.serviceId = service.id || index;
        card.dataset.serviceIndex = index;
        card.setAttribute('role', 'button');
        card.setAttribute('tabindex', '0');
        card.setAttribute('aria-pressed', 'false');
        card.setAttribute('aria-describedby', `service-description-${index}`);
        const cardContent = `
            <div class="service-card-inner">
                ${this.renderCheckmark()}
                ${this.renderCardHeader(service)}
                ${this.renderCardBody(service, index)}
                ${this.renderCardFooter(service)}
            </div>
        `;
        card.innerHTML = cardContent;
        // Add event listeners
        card.addEventListener('click', () => this.handleCardClick(card, service));
        card.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                this.handleCardClick(card, service);
            }
        });
        return card;
    }
    renderCheckmark() {
        return `
            <div class="checkmark-icon" aria-hidden="true">
                ${this.factory.SVG_ICONS.CHECK}
            </div>
        `;
    }
    renderCardHeader(service) {
        const titleElement = service.title || service.name || service.eventName || 'Unnamed Service';
        const durationElement = this.showDuration && service.duration ?
            `<div class="service-duration">${service.duration}</div>` : '';
        return `
            <div class="service-card-header">
                <div class="service-title">${titleElement}</div>
                ${durationElement}
            </div>
        `;
    }
    renderCardBody(service, index) {
        const description = this.showDescription && service.description ?
            `<div class="service-description" id="service-description-${index}">${service.description}</div>` : '';
        const price = service.price ?
            `<div class="service-price">${service.price}</div>` : '';
        const features = service.features && Array.isArray(service.features) ?
            `<ul class="service-features">
                ${service.features.map(feature => `<li>${feature}</li>`).join('')}
            </ul>` : '';
        return `
            <div class="service-card-body">
                ${description}
                ${features}
                ${price}
            </div>
        `;
    }
    renderCardFooter(service) {
        if (!service.badge && !service.popular && !service.recommended) {
            return '';
        }
        let badgeContent = '';
        if (service.popular) {
            badgeContent = '<div class="service-badge popular">Populaire</div>';
        } else if (service.recommended) {
            badgeContent = '<div class="service-badge recommended">Recommandé</div>';
        } else if (service.badge) {
            badgeContent = `<div class="service-badge custom">${service.badge}</div>`;
        }
        return badgeContent ? `<div class="service-card-footer">${badgeContent}</div>` : '';
    }
    handleCardClick(cardElement, service) {
        if (this.selectionMode === 'single') {
            this.handleSingleSelection(cardElement, service);
        } else {
            this.handleMultipleSelection(cardElement, service);
        }
        this.updateValue();
        this.hideError();
    }
    handleSingleSelection(cardElement, service) {
        const allCards = this.element.querySelectorAll('.service-card');
        allCards.forEach(card => {
            card.classList.remove('selected');
            card.setAttribute('aria-pressed', 'false');
        });
        if (this.allowDeselect && this.selectedService && this.selectedService.id === service.id) {
            this.selectedService = null;
            this.selectedServices = [];
            return;
        }
        cardElement.classList.add('selected');
        cardElement.setAttribute('aria-pressed', 'true');
        this.selectedService = service;
        this.selectedServices = [service];
    }
    handleMultipleSelection(cardElement, service) {
        const isSelected = cardElement.classList.contains('selected');
        if (isSelected) {
            cardElement.classList.remove('selected');
            cardElement.setAttribute('aria-pressed', 'false');
            this.selectedServices = this.selectedServices.filter(s => s.id !== service.id);
        } else {
            cardElement.classList.add('selected');
            cardElement.setAttribute('aria-pressed', 'true');
            this.selectedServices.push(service);
        }
        this.selectedService = this.selectedServices.length > 0 ? this.selectedServices[0] : null;
    }
    updateValue() {
        const value = this.selectionMode === 'single' ?
            this.selectedService :
            this.selectedServices;
        this.handleChange();
    }
    getValue() {
        return this.selectionMode === 'single' ?
            this.selectedService :
            this.selectedServices;
    }
    setValue(value) {
        this.selectedService = null;
        this.selectedServices = [];
        const allCards = this.element.querySelectorAll('.service-card');
        allCards.forEach(card => {
            card.classList.remove('selected');
            card.setAttribute('aria-pressed', 'false');
        });
        if (!value) return;
        if (this.selectionMode === 'single') {
            if (typeof value === 'object' && value.id) {
                this.selectedService = value;
                this.selectedServices = [value];
                const card = this.element.querySelector(`[data-service-id="${value.id}"]`);
                if (card) {
                    card.classList.add('selected');
                    card.setAttribute('aria-pressed', 'true');
                }
            }
        } else {
            if (Array.isArray(value)) {
                this.selectedServices = [...value];
                this.selectedService = value.length > 0 ? value[0] : null;
                value.forEach(service => {
                    const card = this.element.querySelector(`[data-service-id="${service.id}"]`);
                    if (card) {
                        card.classList.add('selected');
                        card.setAttribute('aria-pressed', 'true');
                    }
                });
            }
        }
    }
    showError(message) {
        const errorElement = this.element.querySelector(`#${this.id}-error`);
        if (errorElement) {
            const errorText = errorElement.querySelector('.error-text');
            if (errorText) {
                errorText.textContent = message;
            }
            errorElement.classList.add('show');
        }
    }
    hideError() {
        const errorElement = this.element.querySelector(`#${this.id}-error`);
        if (errorElement) {
            errorElement.classList.remove('show');
        }
    }
}
/**
 * CreatForm - Main form creation and management class
 */
class CreatForm {
    constructor(config = {}, formData = {}, formConfig = {}, defaultConfig = {}) {
        this.config = {
            language: config.language || "fr",
            webhookUrl: config.webhookUrl || defaultConfig.DEFAULT_WEBHOOK,
            webhookEnabled: config.webhookEnabled !== false,
            voiceflowEnabled: config.voiceflowEnabled !== false,
            cssUrls: config.cssUrls || defaultConfig.DEFAULT_CSS,
            enableSessionTimeout: config.enableSessionTimeout !== false,
            sessionTimeout: config.sessionTimeout || defaultConfig.SESSION_TIMEOUT,
            sessionWarning: config.sessionWarning || defaultConfig.SESSION_WARNING,
            debounceDelay: config.debounceDelay || defaultConfig.DEBOUNCE_DELAY,
            formType: config.formType || "submission",
            formStructure: config.formStructure || "auto",
            submitButtonText: config.submitButtonText || null,
            showSubmitButton: config.showSubmitButton !== false,
            apiKey: config.apiKey || "",
            timezone: config.timezone || "America/Toronto",
            // ============================================================================
            // SIMPLIFIED DATA TRANSFORMER CONFIGURATION - No more flatData!
            // ============================================================================
            // Use structured data format (sections, metadata, etc.)
            useStructuredData: config.useStructuredData !== false, // Default to true now
            // Data transformer class or instance - defaults to BaseDataTransformer
            dataTransformer: config.dataTransformer || null,
            // Voiceflow-specific data transformer
            voiceflowDataTransformer: config.voiceflowDataTransformer || null,
            // Enhanced logging configuration
            enableDetailedLogging: config.enableDetailedLogging !== false,
            logPrefix: config.logPrefix || "📋 CreatForm",
            // FIXED: Add custom onSubmit handler to config
            onSubmit: config.onSubmit || null,
            // Add onStepChange handler
            onStepChange: config.onStepChange || null
        };
        // Store the passed data
        this.formData = formData;
        this.formConfig = formConfig;
        this.defaultConfig = defaultConfig;
        this.state = {
            cssLoaded: false,
            initialized: false,
            formSubmitted: false,
            sessionExpired: false,
            currentStep: 0,
            isSingleStep: false
        };
        this.elements = new Map();
        this.formValues = {};
        this.sessionTimer = null;
        this.warningTimer = null;
        this.cssCache = new Map();
        this.combinedCSS = null; // NEW: Store combined CSS for container injection
        this.isBookingForm = this.config.formType === "booking";
        // Initialize logging
        this.initializeLogging();
        // Initialize data transformer and processor
        this.initializeDataProcessor();
        // Determine form structure
        this.determineFormStructure();
    }
    // ============================================================================
    // NEW: DATA PROCESSOR INITIALIZATION (replaces flatData approach)
    // ============================================================================
    initializeDataProcessor() {
        this.logger.info('🔧 Initializing data processor...');
        // Initialize the form data processor (same approach as CustomField)
        this.dataProcessor = new FormDataProcessor(this);
        // Initialize field value formatter for backward compatibility
        this.formatter = new FieldValueFormatter(this);
        // Initialize data transformer
        if (this.config.dataTransformer) {
            if (typeof this.config.dataTransformer === 'function') {
                // It's a class constructor
                this.dataTransformerInstance = new this.config.dataTransformer(this);
                this.logger.info('✅ Custom data transformer class instantiated:', this.config.dataTransformer.name);
            } else if (typeof this.config.dataTransformer === 'object') {
                // It's an instance
                this.dataTransformerInstance = this.config.dataTransformer;
                this.dataTransformerInstance.creatFormInstance = this; // Ensure reference
                this.logger.info('✅ Custom data transformer instance configured');
            }
        } else {
            // Default to BaseDataTransformer
            this.dataTransformerInstance = new BaseDataTransformer(this);
            this.logger.info('✅ Default BaseDataTransformer initialized');
        }
    }
    // ============================================================================
    // ENHANCED LOGGING SYSTEM
    // ============================================================================
    initializeLogging() {
        this.logger = {
            info: (message, data = null) => {
                if (this.config.enableDetailedLogging) {
                    console.log(`${this.config.logPrefix} ℹ️`, message, data || '');
                }
            },
            success: (message, data = null) => {
                if (this.config.enableDetailedLogging) {
                    console.log(`${this.config.logPrefix} ✅`, message, data || '');
                }
            },
            warning: (message, data = null) => {
                if (this.config.enableDetailedLogging) {
                    console.warn(`${this.config.logPrefix} ⚠️`, message, data || '');
                }
            },
            error: (message, data = null) => {
                console.error(`${this.config.logPrefix} ❌`, message, data || '');
            },
            webhook: (message, data = null) => {
                if (this.config.enableDetailedLogging) {
                    console.group(`${this.config.logPrefix} 🔗 WEBHOOK`);
                    console.log(message);
                    if (data) console.log('📤 Webhook Data:', JSON.stringify(data, null, 2));
                    console.groupEnd();
                }
            },
            voiceflow: (message, data = null) => {
                if (this.config.enableDetailedLogging) {
                    console.group(`${this.config.logPrefix} 🤖 VOICEFLOW`);
                    console.log(message);
                    if (data) console.log('📤 Voiceflow Data:', JSON.stringify(data, null, 2));
                    console.groupEnd();
                }
            },
            transformation: (originalData, transformedData) => {
                if (this.config.enableDetailedLogging) {
                    console.group(`${this.config.logPrefix} 🔄 DATA TRANSFORMATION`);
                    console.log('📥 Original Form Data:', JSON.stringify(originalData, null, 2));
                    console.log('📤 Transformed Data:', JSON.stringify(transformedData, null, 2));
                    console.groupEnd();
                }
            }
        };
        this.logger.info('CreatForm initialized', {
            formType: this.config.formType,
            structure: this.state.isSingleStep ? 'single-step' : 'multi-step',
            webhookEnabled: this.config.webhookEnabled,
            voiceflowEnabled: this.config.voiceflowEnabled,
            useStructuredData: this.config.useStructuredData,
            hasDataTransformer: !!this.dataTransformerInstance,
            hasVoiceflowTransformer: typeof this.config.voiceflowDataTransformer === 'function'
        });
    }
    // ============================================================================
    // UTILITY METHODS (updated to use formatter - NO MORE extractValue!)
    // ============================================================================
    getText(path) {
        return this.getNestedValue(this.formData.translations[this.config.language], path) || path;
    }
    getData(path) {
        const data = this.getNestedValue(this.formData.options, path) || [];
        return Array.isArray(data) ? data.map(item => ({
            ...item,
            name: typeof item.name === 'object' ? item.name[this.config.language] || item.name.en : item.name
        })) : data;
    }
    getNestedValue(obj, path) {
        return path.split('.')
            .reduce((curr, key) => curr?.[key], obj);
    }
    getErrorMessage(fieldId, errorType = 'required') {
        return this.getText(`errors.${fieldId}${errorType !== 'required' ? '_' + errorType : ''}`) ||
            this.getText(`errors.${errorType}`) ||
            this.getText('common.fieldRequired');
    }
    // UPDATED: No more extractValue - use formatter directly
    formatValue(fieldConfig, value) {
        return this.formatter.formatValue(fieldConfig || {}, value);
    }
    // UPDATED: formatValueForDisplay now uses FieldValueFormatter consistently
    formatValueForDisplay(fieldId, value, fieldConfig = null) {
        const formattedValue = this.formatter.formatValue(fieldConfig || {}, value);
        if (!formattedValue || formattedValue === '') {
            return this.getText('common.notSpecified') || 'Non spécifié';
        }
        return formattedValue;
    }
    // ============================================================================
    // ENHANCED DATA TRANSFORMATION - NO MORE FLATDATA!
    // ============================================================================
    /**
     * Enhanced data preparation using FormDataProcessor (same as CustomField approach)
     */
    prepareDataForSubmission(originalFormValues) {
        this.logger.info('🔧 Preparing data for submission using FormDataProcessor...', originalFormValues);
        try {
            // Use the data transformer to process the data
            const transformedData = this.dataTransformerInstance.transform(originalFormValues);
            // Add base submission metadata
            const submissionData = {
                ...transformedData,
                userAgent: navigator.userAgent,
                submissionUrl: window.location.href,
                submissionTimestamp: new Date()
                    .toISOString()
            };
            this.logger.transformation(originalFormValues, submissionData);
            return submissionData;
        } catch (error) {
            this.logger.error('❌ Data transformation failed:', error);
            // Fallback to basic format
            return {
                submissionType: this.config.formType === "booking" ? "booking_form" : "submission_form",
                formVersion: this.defaultConfig.FORM_VERSION || '1.0.0',
                submissionTimestamp: new Date()
                    .toISOString(),
                language: this.config.language,
                userAgent: navigator.userAgent,
                rawFormData: originalFormValues,
                transformationError: error.message
            };
        }
    }
    // ============================================================================
    // ENHANCED FORM CREATION (updated to pass processor to CustomField)
    // ============================================================================
    createFields(fieldsConfig) {
        return fieldsConfig.map(fieldConfig => {
            const field = {
                ...fieldConfig,
                name: fieldConfig.id,
                label: this.getText(`fields.${fieldConfig.id}`),
                placeholder: fieldConfig.placeholder || this.getText(`fields.${fieldConfig.id}`) + '...',
                customErrorMessage: this.getErrorMessage(fieldConfig.id)
            };
            // Handle options
            if (fieldConfig.options) {
                if (typeof fieldConfig.options === 'string') {
                    field.options = this.getData(fieldConfig.options);
                    if (fieldConfig.type === 'serviceCard') {
                        field.services = this.getData(fieldConfig.options);
                    }
                } else {
                    field.options = fieldConfig.options.map(opt => ({
                        ...opt,
                        name: typeof opt.name === 'object' ? opt.name[this.config.language] : opt.name
                    }));
                }
            }
            // Handle custom options
            if (fieldConfig.customOptions) {
                field.customOptions = fieldConfig.customOptions.map(opt => ({
                    ...opt,
                    label: typeof opt.label === 'object' ? opt.label[this.config.language] || opt.label.en : opt.label
                }));
            }
            // Handle nested fields
            if (fieldConfig.yesFields) field.yesFields = this.createFields(fieldConfig.yesFields);
            if (fieldConfig.yesField) field.yesField = this.createFields([fieldConfig.yesField])[0];
            if (fieldConfig.noField) field.noField = this.createFields([fieldConfig.noField])[0];
            // Handle calendar fields for booking forms
            if (fieldConfig.type === 'calendar' && this.isBookingForm) {
                field.apiKey = this.config.apiKey;
                field.timezone = this.config.timezone;
                field.language = this.config.language;
                field.eventTypeId = null;
                field.eventTypeSlug = null;
                field.scheduleId = null;
                field.eventName = "Appointment";
                field.serviceProvider = "";
            }
            return field;
        });
    }
    // ============================================================================
    // ENHANCED SUBMISSION HANDLING (FIXED to call custom onSubmit)
    // ============================================================================
    handleSubmission = async (formData) => {
        this.logger.info('🚀 Starting enhanced submission process...', {
            formType: this.config.formType,
            webhookEnabled: this.config.webhookEnabled,
            voiceflowEnabled: this.config.voiceflowEnabled,
            hasDataTransformer: !!this.dataTransformerInstance,
            hasCustomOnSubmit: typeof this.config.onSubmit === 'function' // NEW: Log if custom handler exists
        });
        const submitButton = this.getSubmitButton();
        if (submitButton) {
            submitButton.disabled = true;
            submitButton.textContent = this.getText('nav.processing');
        }
        try {
            let submissionData;
            let shouldSendToWebhook = false;
            // NEW: Check for custom onSubmit handler first (for cancellation, custom forms, etc.)
            if (typeof this.config.onSubmit === 'function') {
                this.logger.info('🔧 Calling custom onSubmit handler...');
                try {
                    // Call the custom submission handler (e.g., cancellation API call)
                    submissionData = await this.config.onSubmit(formData);
                    this.logger.success('✅ Custom onSubmit handler completed successfully');
                    // Don't send to webhook for custom handlers unless explicitly enabled
                    shouldSendToWebhook = false;
                } catch (customError) {
                    this.logger.error('❌ Custom onSubmit handler failed:', customError);
                    throw customError;
                }
            }
            // Regular submission logic for booking and standard forms
            else if (this.isBookingForm) {
                this.logger.info('Processing booking form submission...');
                const calendarField = this.getCalendarFieldInstance();
                if (!calendarField) {
                    throw new Error('Calendar field not found');
                }
                const bookingResponse = await calendarField.createBooking(
                    formData.appointment.selectedTime,
                    `${formData.firstName} ${formData.lastName}`,
                    formData.email
                );
                if (!bookingResponse) {
                    throw new Error('Booking creation failed');
                }
                submissionData = this.prepareBookingDataForSubmission(formData, bookingResponse);
                shouldSendToWebhook = this.config.webhookEnabled && this.config.webhookUrl;
            } else {
                this.logger.info('Processing regular form submission...');
                submissionData = this.prepareDataForSubmission(formData);
                shouldSendToWebhook = this.config.webhookEnabled && this.config.webhookUrl;
            }
            // Webhook submission (only if no custom handler or explicitly enabled)
            if (shouldSendToWebhook) {
                await this.sendToWebhook(submissionData);
            }
            this.clearSessionTimers();
            this.state.formSubmitted = true;
            this.showSuccessScreen();
            // Voiceflow submission (always send if enabled, regardless of custom handler)
            if (this.config.voiceflowEnabled) {
                await this.sendToVoiceflow(submissionData, formData);
            }
            this.logger.success('🎉 Enhanced submission completed successfully!');
            return submissionData;
        } catch (error) {
            this.logger.error('Enhanced submission failed:', error);
            if (submitButton) {
                const errorMessage = this.isBookingForm ?
                    (this.getText('errors.bookingError') || 'Booking error. Please try again.') :
                    (this.getText('errors.cancellationError') || 'Submission error. Please try again.');
                submitButton.textContent = errorMessage;
                submitButton.disabled = false;
            }
            throw error;
        }
    };
    // NEW: Separate webhook submission method
    async sendToWebhook(submissionData) {
        this.logger.webhook('Sending data to webhook...', {
            url: this.config.webhookUrl,
            dataType: 'structured (no flatData)'
        });
        try {
            const webhookStartTime = Date.now();
            const response = await fetch(this.config.webhookUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(submissionData)
            });
            const webhookDuration = Date.now() - webhookStartTime;
            if (response.ok) {
                this.logger.webhook(`✅ Webhook submission successful (${webhookDuration}ms)`);
            } else {
                this.logger.webhook(`⚠️ Webhook submission failed (${webhookDuration}ms)`, {
                    status: response.status,
                    statusText: response.statusText
                });
            }
        } catch (webhookError) {
            this.logger.webhook('❌ Webhook submission error', webhookError);
        }
    }
    // NEW: Separate Voiceflow submission method
    async sendToVoiceflow(submissionData, originalFormData) {
        this.logger.voiceflow('Voiceflow integration enabled - preparing data...');
        let voiceflowPayload = submissionData;
        // Apply Voiceflow-specific transformation if provided
        if (this.config.voiceflowDataTransformer && typeof this.config.voiceflowDataTransformer === 'function') {
            this.logger.voiceflow('Using custom Voiceflow data transformer');
            try {
                const transformStartTime = Date.now();
                voiceflowPayload = this.config.voiceflowDataTransformer(submissionData, originalFormData, this);
                const transformDuration = Date.now() - transformStartTime;
                this.logger.transformation(submissionData, voiceflowPayload);
                this.logger.voiceflow(`✅ Voiceflow transformation completed (${transformDuration}ms)`);
            } catch (transformError) {
                this.logger.voiceflow('❌ Error in Voiceflow transformer:', transformError);
                voiceflowPayload = submissionData; // Fallback
            }
        }
        // Send to Voiceflow
        if (window.voiceflow && window.voiceflow.chat && window.voiceflow.chat.interact) {
            try {
                const voiceflowStartTime = Date.now();
                this.logger.voiceflow('📤 Sending data to Voiceflow...', {
                    payload: voiceflowPayload,
                    interactionType: 'success'
                });
                window.voiceflow.chat.interact({
                    type: "success",
                    payload: voiceflowPayload
                });
                const voiceflowDuration = Date.now() - voiceflowStartTime;
                this.logger.voiceflow(`✅ Voiceflow interaction completed (${voiceflowDuration}ms)`);
            } catch (voiceflowError) {
                this.logger.voiceflow('❌ Voiceflow interaction error', voiceflowError);
            }
        } else {
            this.logger.warning('Voiceflow not available in window object');
        }
    }
    // ============================================================================
    // FORM STRUCTURE DETECTION
    // ============================================================================
    determineFormStructure() {
        const steps = this.formConfig.steps || [];
        if (this.config.formStructure === "single") {
            this.state.isSingleStep = true;
        } else if (this.config.formStructure === "multistep") {
            this.state.isSingleStep = false;
        } else {
            // Auto-detect based on steps
            this.state.isSingleStep = steps.length <= 1;
        }
        this.logger.info(`Form structure determined: ${this.state.isSingleStep ? 'Single Step' : 'Multi Step'}`);
    }
    // ============================================================================
    // FIXED CSS MANAGEMENT - Container-scoped injection for Voiceflow compatibility
    // ============================================================================
    async loadCSS() {
        if (this.state.cssLoaded) return;
        try {
            this.logger.info('Loading CSS files...');
            const cssPromises = this.config.cssUrls.map(url => this.fetchCSS(url));
            const cssTexts = await Promise.allSettled(cssPromises);
            const validCSS = cssTexts
                .filter(result => result.status === 'fulfilled' && result.value)
                .map(result => result.value)
                .join('\n');
            if (validCSS.trim()) {
                // Store the CSS for container injection
                this.combinedCSS = validCSS;
            }
            this.state.cssLoaded = true;
            this.logger.success('CSS loaded successfully');
        } catch (error) {
            this.logger.error('Failed to load CSS:', error);
        }
    }
    async fetchCSS(url) {
        if (this.cssCache.has(url)) return this.cssCache.get(url);
        try {
            const response = await fetch(url);
            const css = response.ok ? await response.text() : '';
            this.cssCache.set(url, css);
            return css;
        } catch (error) {
            this.logger.warning(`Failed to fetch CSS from ${url}:`, error);
            return '';
        }
    }
    // NEW: Inject CSS into container instead of document.head (Voiceflow-compatible)
    injectCSSIntoContainer(container) {
        if (!this.combinedCSS) return;
        const styleClass = this.isBookingForm ? 'booking-form-styles' : 'submission-form-styles';
        // Remove existing styles from this container
        const existingStyle = container.querySelector(`.${styleClass}`);
        if (existingStyle) {
            existingStyle.remove();
        }
        // Create new style element and inject into container
        const styleElement = document.createElement('style');
        styleElement.className = styleClass;
        styleElement.textContent = this.combinedCSS;
        container.appendChild(styleElement); // ← Inject into container, not document.head
        this.logger.success('CSS injected into container successfully');
    }
    // DEPRECATED: Keep for backward compatibility but prefer container injection
    injectCSS(css) {
        // Fallback to old method if container injection fails
        const styleClass = this.isBookingForm ? 'booking-form-styles' : 'submission-form-styles';
        document.querySelector(`.${styleClass}`)
            ?.remove();
        const styleElement = document.createElement('style');
        styleElement.className = styleClass;
        styleElement.textContent = css;
        document.head.appendChild(styleElement);
    }
    // ============================================================================
    // FORM CREATION - Enhanced for single/multistep support
    // ============================================================================
    createFormSteps() {
        return this.formConfig.steps.map((stepConfig, index) => {
            if (stepConfig.fields.length === 1 &&
                (stepConfig.fields[0].type === 'summary' || stepConfig.fields[0].autoGenerate || stepConfig.fields[0].type === 'custom')) {
                return {
                    title: this.getText(`steps.${index}.title`),
                    description: this.getText(`steps.${index}.desc`),
                    fields: [{
                        type: 'custom',
                        id: 'summary',
                        name: 'summary',
                        autoSummary: true,
                        label: ''
                    }]
                };
            }
            return {
                title: this.getText(`steps.${index}.title`),
                description: this.getText(`steps.${index}.desc`),
                fields: this.createFields(stepConfig.fields)
            };
        });
    }
    // ============================================================================
    // ENHANCED SINGLE STEP FORM CREATION WITH ROW SUPPORT AND OPTIONAL SUBMIT BUTTON
    // ============================================================================
    // Helper method to group fields by row (same logic as FormStep)
    groupFieldsForSingleStep(fields) {
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
    createSingleStepForm() {
        const firstStep = this.formConfig.steps[0];
        if (!firstStep) {
            throw new Error('No steps defined for single step form');
        }
        this.logger.info('Creating single step form with row support');
        const container = document.createElement('div');
        // Use same base class as multi-step for consistent styling
        container.className = 'multistep-form single-step-variant';
        // Create form - Use same structure as multi-step
        const form = document.createElement('form');
        form.className = 'form-step active'; // Same as multi-step step class
        // Create fields container
        const fieldsContainer = document.createElement('div');
        fieldsContainer.className = 'step-fields';
        // Create fields with proper row grouping
        const fields = this.createFields(firstStep.fields);
        const fieldInstances = [];
        // Use the same grouping logic as multi-step forms
        const fieldGroups = this.groupFieldsForSingleStep(fields);
        fieldGroups.forEach(group => {
            if (group.isRow) {
                // Create row container
                const rowContainer = document.createElement('div');
                rowContainer.className = 'field-row';
                group.fields.forEach(fieldConfig => {
                    const colContainer = document.createElement('div');
                    colContainer.className = 'field-col';
                    const field = this.factory.createField(fieldConfig);
                    if (field) {
                        fieldInstances.push(field);
                        colContainer.appendChild(field.render());
                    }
                    rowContainer.appendChild(colContainer);
                });
                fieldsContainer.appendChild(rowContainer);
            } else {
                // Single field
                const field = this.factory.createField(group.fields[0]);
                if (field) {
                    fieldInstances.push(field);
                    fieldsContainer.appendChild(field.render());
                }
            }
        });
        form.appendChild(fieldsContainer);
        // Create navigation container only if submit button is enabled
        if (this.config.showSubmitButton) {
            const navigationContainer = document.createElement('div');
            navigationContainer.className = 'form-navigation';
            const submitButton = document.createElement('button');
            submitButton.type = 'button';
            submitButton.className = 'btn btn-submit';
            submitButton.textContent = this.config.submitButtonText || this.getText('nav.submit');
            submitButton.addEventListener('click', async () => {
                this.logger.info('Single step form submit button clicked');
                // Validate all fields
                let isValid = true;
                fieldInstances.forEach(field => {
                    if (!field.validate()) {
                        isValid = false;
                    }
                });
                if (isValid) {
                    // Collect form data
                    const formData = {};
                    fieldInstances.forEach(field => {
                        formData[field.name] = field.getValue();
                    });
                    this.logger.info('Single step form validation passed, submitting...', formData);
                    // Submit
                    await this.handleSubmission(formData);
                } else {
                    this.logger.warning('Single step form validation failed');
                }
            });
            navigationContainer.appendChild(submitButton);
            form.appendChild(navigationContainer);
            // Store references for cleanup
            this.singleStepForm = {
                container,
                fieldInstances,
                submitButton
            };
        } else {
            // Store references for cleanup (without submit button)
            this.singleStepForm = {
                container,
                fieldInstances,
                submitButton: null
            };
        }
        container.appendChild(form);
        this.logger.success('Single step form created successfully');
        return container;
    }
    // ============================================================================
    // BOOKING-SPECIFIC METHODS
    // ============================================================================
    updateCalendarConfiguration(selectedService) {
        if (!this.isBookingForm || !selectedService) return;
        this.logger.info('Updating calendar configuration with service:', selectedService);
        const calendarField = this.getCalendarFieldInstance();
        if (calendarField) {
            this.logger.info('Found calendar field, updating configuration...');
            calendarField.apiKey = this.config.apiKey;
            calendarField.timezone = this.config.timezone;
            calendarField.eventTypeId = selectedService.eventTypeId;
            calendarField.eventTypeSlug = selectedService.eventTypeSlug;
            calendarField.scheduleId = selectedService.scheduleId;
            calendarField.eventName = selectedService.eventName || selectedService.title;
            calendarField.serviceProvider = selectedService.provider || "SkaLean";
            calendarField.serviceName = selectedService.title;
            calendarField.mode = 'booking';
            calendarField.state.selectedDate = null;
            calendarField.state.selectedTime = null;
            calendarField.state.availableSlots = {};
            if (calendarField.updateCalendarHeader) {
                calendarField.updateCalendarHeader();
            }
            calendarField.init()
                .then(() => {
                    if (calendarField.element) {
                        calendarField.renderCalendarData();
                    }
                    this.logger.success('Calendar reinitialized with new service configuration');
                })
                .catch(error => {
                    this.logger.error('Error reinitializing calendar:', error);
                });
        } else {
            this.logger.info('Calendar field not found, will be configured when calendar step is reached');
        }
    }
    getCalendarFieldInstance() {
        if (!this.isBookingForm) return null;
        // For single step forms
        if (this.state.isSingleStep && this.singleStepForm) {
            const calendarField = this.singleStepForm.fieldInstances.find(field =>
                field.constructor.name === 'CalendarField'
            );
            if (calendarField) return calendarField;
        }
        // For multi-step forms
        if (this.multiStepForm) {
            for (let stepIndex = 0; stepIndex < this.multiStepForm.stepInstances.length; stepIndex++) {
                const stepInstance = this.multiStepForm.stepInstances[stepIndex];
                if (stepInstance && stepInstance.fieldInstances) {
                    const calendarField = stepInstance.fieldInstances.find(field =>
                        field.constructor.name === 'CalendarField'
                    );
                    if (calendarField) return calendarField;
                }
            }
        }
        return null;
    }
    prepareBookingDataForSubmission(formValues, bookingResponse) {
        const appointment = formValues.appointment || {};
        const formattedDate = appointment.selectedDate ?
            new Intl.DateTimeFormat(this.config.language === "fr" ? "fr-CA" : "en-US", {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            })
            .format(new Date(appointment.selectedDate)) : '';
        const formattedTime = appointment.selectedTime ?
            new Intl.DateTimeFormat(this.config.language === "fr" ? "fr-CA" : "en-US", {
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
            })
            .format(new Date(appointment.selectedTime)) : '';
        return {
            firstName: formValues.firstName || '',
            lastName: formValues.lastName || '',
            fullName: `${formValues.firstName || ''} ${formValues.lastName || ''}`.trim(),
            email: formValues.email || '',
            service: formValues.serviceSelection?.eventName || '',
            serviceTitle: formValues.serviceSelection?.title || '',
            serviceDuration: formValues.serviceSelection?.duration || '',
            appointmentDate: appointment.formattedDate || '',
            appointmentTime: appointment.formattedTime || '',
            appointmentDateTime: appointment.selectedTime || '',
            formattedDate,
            formattedTime,
            formattedDateTime: `${formattedDate} ${this.config.language === "fr" ? "à" : "at"} ${formattedTime}`,
            bookingId: bookingResponse?.data?.id || null,
            bookingUid: bookingResponse?.data?.uid || null,
            formLanguage: this.config.language,
            submissionTimestamp: new Date()
                .toISOString(),
            formVersion: this.defaultConfig.FORM_VERSION,
            userAgent: navigator.userAgent,
            formType: "booking_form",
            timezone: this.config.timezone
        };
    }
    // ============================================================================
    // ENHANCED EVENT HANDLERS
    // ============================================================================
    handleFieldChange = (name, value) => {
        this.formValues[name] = value;
        this.logger.info(`Field ${name} changed:`, {
            value,
            formatted: this.formatValue({}, value)
        });
        if (this.isBookingForm && name === 'serviceSelection' && value) {
            this.logger.info('Service selected:', value);
            this.updateCalendarConfiguration(value);
        }
    };
    // ============================================================================
    // FIXED SESSION MANAGEMENT - Container-scoped and Voiceflow-integrated
    // ============================================================================
    setupSessionManagement() {
        if (!this.config.enableSessionTimeout) {
            this.logger.info('Session timeout disabled');
            return;
        }
        this.logger.info('Setting up session management:', {
            warningTime: this.config.sessionWarning,
            timeoutTime: this.config.sessionTimeout
        });
        this.warningTimer = setTimeout(() => this.showSessionWarning(), this.config.sessionWarning);
        this.sessionTimer = setTimeout(() => this.disableFormOnTimeout(), this.config.sessionTimeout);
    }
    // FIXED: Show warning inside the form container (not document.body)
    showSessionWarning() {
        if (this.state.formSubmitted || this.state.sessionExpired) return;
        this.logger.warning('Session warning displayed');
        // Remove any existing warning first
        const existingWarning = this.container?.querySelector('.session-warning');
        if (existingWarning) {
            existingWarning.remove();
        }
        // Create warning div
        const warningDiv = document.createElement('div');
        warningDiv.className = 'session-warning';
        warningDiv.style.cssText = `
            position: absolute;
            top: 10px;
            right: 10px;
            left: 10px;
            background: #fff3cd;
            border: 1px solid #ffeaa7;
            border-radius: 8px;
            padding: 15px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 1000;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            color: #856404;
            animation: slideDown 0.3s ease-out;
        `;
        warningDiv.innerHTML = `
            <div style="display: flex; align-items: center; margin-bottom: 8px;">
                <span style="font-size: 18px; margin-right: 8px;">⚠️</span>
                <strong style="font-size: 14px;">Session Warning</strong>
            </div>
            <p style="margin: 0; font-size: 13px; line-height: 1.4;">
                Your session will expire in 2 minutes. Please complete the form soon.
            </p>
        `;
        // Add CSS animation if not already present
        if (!document.querySelector('#session-warning-styles')) {
            const style = document.createElement('style');
            style.id = 'session-warning-styles';
            style.textContent = `
                @keyframes slideDown {
                    from { transform: translateY(-100%); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
            `;
            document.head.appendChild(style);
        }
        // Append to form container instead of document.body
        if (this.container) {
            this.container.style.position = 'relative'; // Ensure container can contain positioned elements
            this.container.appendChild(warningDiv);
        } else {
            // Fallback if container not available
            document.body.appendChild(warningDiv);
        }
        // Auto-remove after 30 seconds
        setTimeout(() => {
            if (warningDiv.parentNode) {
                warningDiv.remove();
            }
        }, 30000);
    }
    disableFormOnTimeout() {
        if (this.state.formSubmitted || this.state.sessionExpired) return;
        this.state.sessionExpired = true;
        this.logger.warning('Session expired - disabling form');
        const formContainer = this.state.isSingleStep ?
            this.singleStepForm?.container :
            this.multiStepForm?.container;
        if (formContainer) {
            formContainer.querySelectorAll('input, select, button, textarea, [contenteditable]')
                .forEach(el => {
                    el.disabled = true;
                    el.style.opacity = '0.5';
                    el.style.pointerEvents = 'none';
                });
        }
        // Show timeout overlay and send to Voiceflow
        this.showTimeoutOverlay();
    }
    // FIXED: Better container positioning and Voiceflow integration
    showTimeoutOverlay() {
        // Remove any existing timeout overlay
        const existingOverlay = this.container?.querySelector('.timeout-overlay');
        if (existingOverlay) {
            existingOverlay.remove();
        }
        const overlay = document.createElement('div');
        overlay.className = 'timeout-overlay';
        // Enhanced styling for better container containment
        overlay.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.6);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 9999;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            animation: fadeIn 0.3s ease-out;
            border-radius: 20px;
        `;
        overlay.innerHTML = `
            <div style="
                background: white; 
                padding: 40px; 
                border-radius: 12px; 
                text-align: center; 
                max-width: 400px; 
                margin: 20px;
                box-shadow: 0 10px 25px rgba(0,0,0,0.3);
                position: relative;
            ">
                <div style="color: #b4946e; font-size: 48px; margin-bottom: 20px;">⏰</div>
                <span style="color: #333; margin: 0 0 15px 0; font-size: 20px;">Session Expired</span>
                <p style="color: #666; margin: 0; line-height: 1.5; font-size: 14px;">
                    Your session has expired after ${this.config.sessionTimeout / 60000} minutes of inactivity. 
                    The form is no longer available.
                </p>
            </div>
        `;
        // Add CSS animation if not already present
        if (!document.querySelector('#timeout-overlay-styles')) {
            const style = document.createElement('style');
            style.id = 'timeout-overlay-styles';
            style.textContent = `
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
            `;
            document.head.appendChild(style);
        }
        // Ensure container can contain the overlay
        if (this.container) {
            this.container.style.position = 'relative';
            this.container.appendChild(overlay);
        }
        // FIXED: Send timeout data to Voiceflow
        this.sendTimeoutToVoiceflow();
    }
    // NEW: Send timeout notification to Voiceflow
    sendTimeoutToVoiceflow() {
        this.logger.voiceflow('Sending session timeout notification to Voiceflow...');
        if (window.voiceflow && window.voiceflow.chat && window.voiceflow.chat.interact) {
            try {
                const timeoutPayload = {
                    type: "timeEnd",
                    payload: {
                        message: "Time expired",
                        sessionDuration: this.config.sessionTimeout / 60000, // in minutes
                        formType: this.config.formType,
                        currentStep: this.state.currentStep,
                        formData: this.getFormDataForTimeout(), // Get current form state
                        timestamp: new Date()
                            .toISOString()
                    }
                };
                window.voiceflow.chat.interact(timeoutPayload);
                this.logger.voiceflow('✅ Session timeout sent to Voiceflow successfully', timeoutPayload);
            } catch (voiceflowError) {
                this.logger.voiceflow('❌ Error sending timeout to Voiceflow:', voiceflowError);
            }
        } else {
            this.logger.warning('Voiceflow not available - cannot send timeout notification');
        }
    }
    // NEW: Get current form data for timeout (non-intrusive)
    getFormDataForTimeout() {
        try {
            if (this.state.isSingleStep && this.singleStepForm) {
                const data = {};
                this.singleStepForm.fieldInstances.forEach(field => {
                    try {
                        const value = field.getValue();
                        if (value !== null && value !== undefined && value !== '') {
                            data[field.name] = value;
                        }
                    } catch (err) {
                        // Skip fields that can't be read
                    }
                });
                return data;
            } else if (this.multiStepForm) {
                return this.multiStepForm.getFormData() || {};
            }
            return {};
        } catch (error) {
            this.logger.warning('Could not retrieve form data for timeout:', error);
            return {};
        }
    }
    clearSessionTimers() {
        this.logger.info('Clearing session timers');
        if (this.sessionTimer) {
            clearTimeout(this.sessionTimer);
            this.sessionTimer = null;
        }
        if (this.warningTimer) {
            clearTimeout(this.warningTimer);
            this.warningTimer = null;
        }
        // Remove session warning from container (not document.body)
        const sessionWarning = this.container?.querySelector('.session-warning');
        if (sessionWarning) {
            sessionWarning.remove();
        }
        // Also remove any global session warnings (fallback cleanup)
        document.querySelector('.session-warning')
            ?.remove();
    }
    // ============================================================================
    // ENHANCED SUCCESS SCREEN - Beautiful Modern UI/UX
    // ============================================================================
    showSuccessScreen() {
        const formContainer = this.state.isSingleStep ?
            this.singleStepForm?.container :
            this.multiStepForm?.container;
        if (formContainer) formContainer.style.display = 'none';
        const successScreen = document.createElement('div');
        successScreen.className = 'success-state';
        // Get the SVG check mark from factory, with fallback
        const checkMarkSvg = this.factory?.SVG_ICONS?.CHECK || `
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" width="80px" height="80px">
                <path fill="currentColor" d="M438.6 105.4c12.5 12.5 12.5 32.8 0 45.3l-256 256c-12.5 12.5-32.8 12.5-45.3 0l-128-128c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0L160 338.7 393.4 105.4c12.5-12.5 32.8-12.5 45.3 0z"/>
            </svg>
        `;
        successScreen.style.cssText = `
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 60px 40px;
            text-align: center;
            background: linear-gradient(135deg, #b4946e85, #6e563485);
            border-radius: 20px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.1);
            position: relative;
            overflow: hidden;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
        `;
        successScreen.innerHTML = `
            <!-- Animated background elements -->
            <div style="
                position: absolute;
                top: -50%;
                left: -50%;
                background: radial-gradient(circle, rgba(255,255,255,0.1) 1px, transparent 1px);
                background-size: 50px 50px;
                animation: float 20s linear infinite;
                pointer-events: none;
            "></div>
            
            <!-- Success icon container -->
            <div style="
                width: 80px;
                height: 80px;
                background: rgba(255, 255, 255, 0.95);
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                margin-bottom: 32px;
                box-shadow: 0 15px 35px rgba(0, 0, 0, 0.1);
                backdrop-filter: blur(10px);
                border: 3px solid rgba(255, 255, 255, 0.3);
                animation: successPulse 2s ease-in-out infinite alternate;
                position: relative;
                z-index: 2;
            ">
                <div style="
                    color: #b4946e;
                    width: 80px;
                    height: 80px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    animation: checkmark 1s ease-in-out;
                ">
                    ${checkMarkSvg.replace('width="12px" height="12px"', 'width="60px" height="60px"')}
                </div>
            </div>
            
            <!-- Success message -->
            <div style="position: relative; z-index: 2;">
                <span style="
                    color: #1f2937;
                    font-size: 28px;
                    font-weight: 700;
                    margin: 0 0 16px 0;
                    letter-spacing: -0.5px;
                    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
                ">
                    ${this.getText('success.title')}
                </span>
                
                <p style="
                    color: #4b5563;
                    font-size: 16px;
                    line-height: 1.6;
                    margin: 0;
                    opacity: 0.9;
                ">
                    ${this.getText('success.message')}
                </p>
            </div>
            
            <!-- Decorative elements -->
            <div style="
                position: absolute;
                top: 20px;
                right: 20px;
                width: 6px;
                height: 6px;
                background: rgba(255, 255, 255, 0.6);
                border-radius: 50%;
                animation: twinkle 3s ease-in-out infinite;
            "></div>
            
            <div style="
                position: absolute;
                bottom: 30px;
                left: 30px;
                width: 4px;
                height: 4px;
                background: rgba(255, 255, 255, 0.4);
                border-radius: 50%;
                animation: twinkle 2s ease-in-out infinite 1s;
            "></div>
            
            <div style="
                position: absolute;
                top: 60px;
                left: 20px;
                width: 8px;
                height: 8px;
                background: rgba(255, 255, 255, 0.3);
                border-radius: 50%;
                animation: twinkle 4s ease-in-out infinite 0.5s;
            "></div>
        `;
        // Add CSS animations if not already present
        if (!document.querySelector('#success-screen-styles')) {
            const style = document.createElement('style');
            style.id = 'success-screen-styles';
            style.textContent = `
                @keyframes successPulse {
                    0% { transform: scale(1); box-shadow: 0 15px 35px rgba(0, 0, 0, 0.1); }
                    100% { transform: scale(1.05); box-shadow: 0 20px 45px rgba(0, 0, 0, 0.15); }
                }
                
                @keyframes checkmark {
                    0% { 
                        transform: scale(0) rotate(45deg); 
                        opacity: 0; 
                    }
                    50% { 
                        transform: scale(1.2) rotate(45deg); 
                        opacity: 1; 
                    }
                    100% { 
                        transform: scale(1) rotate(0deg); 
                        opacity: 1; 
                    }
                }
                
                @keyframes float {
                    0% { transform: translate(-50%, -50%) rotate(0deg); }
                    100% { transform: translate(-50%, -50%) rotate(360deg); }
                }
                
                @keyframes twinkle {
                    0%, 100% { opacity: 0.3; transform: scale(1); }
                    50% { opacity: 1; transform: scale(1.2); }
                }
                
                /* Responsive design */
                @media (max-width: 480px) {
                    .success-state {
                        padding: 40px 20px !important;
                        min-height: 300px !important;
                    }
                    .success-state span {
                        font-size: 24px !important;
                    }
                    .success-state p {
                        font-size: 14px !important;
                    }
                }
            `;
            document.head.appendChild(style);
        }
        this.container.appendChild(successScreen);
        this.logger.success('Enhanced success screen displayed with beautiful UI/UX');
    }
    // ============================================================================
    // PUBLIC API FOR EXTERNAL SUBMISSION
    // ============================================================================
    getSubmitButton() {
        if (this.state.isSingleStep && this.singleStepForm) {
            return this.singleStepForm.submitButton; // Can be null if showSubmitButton is false
        }
        return document.querySelector('.btn-submit');
    }
    // Public method to trigger form submission programmatically
    async submitForm() {
        if (this.state.isSingleStep && this.singleStepForm) {
            // Validate all fields
            let isValid = true;
            this.singleStepForm.fieldInstances.forEach(field => {
                if (!field.validate()) {
                    isValid = false;
                }
            });
            if (isValid) {
                // Collect form data
                const formData = {};
                this.singleStepForm.fieldInstances.forEach(field => {
                    formData[field.name] = field.getValue();
                });
                // Submit
                return await this.handleSubmission(formData);
            } else {
                throw new Error('Form validation failed');
            }
        } else if (this.multiStepForm) {
            // For multi-step forms, delegate to the multistep form
            return await this.multiStepForm.submitForm();
        }
        throw new Error('Form not initialized');
    }
    // Public method to validate form without submitting
    validateForm() {
        if (this.state.isSingleStep && this.singleStepForm) {
            return this.singleStepForm.fieldInstances.every(field => field.validate());
        } else if (this.multiStepForm) {
            return this.multiStepForm.validateAllSteps();
        }
        return false;
    }
    // ============================================================================
    // MAIN RENDER METHOD - Enhanced for single/multistep support with fixed CSS
    // ============================================================================
    async render(element) {
        try {
            this.logger.info('🎬 Starting form render process...');
            await this.loadCSS(); // Load CSS but don't inject globally
            this.container = document.createElement('div');
            this.container.className = this.isBookingForm ? 'booking-form-extension' : 'submission-form-extension';
            this.container.id = this.isBookingForm ? 'booking-form-root' : 'submission-form-root';
            // NEW: Inject CSS into the container after creating it (Voiceflow-compatible)
            this.injectCSSIntoContainer(this.container);
            // Enhanced FormFieldFactory configuration
            this.factory = new FormFieldFactory({
                container: this.container,
                formValues: this.formValues,
                onChange: this.handleFieldChange,
                texts: {
                    next: this.getText('nav.next'),
                    previous: this.getText('nav.previous'),
                    submit: this.getText('nav.submit'),
                    required: this.getText('common.required'),
                    fieldRequired: this.getText('common.fieldRequired'),
                    yes: this.getText('common.yes'),
                    no: this.getText('common.no'),
                    other: this.getText('common.other'),
                    selectAtLeastOne: this.getText('errors.selectAtLeastOne'),
                    edit: this.getText('summary.editStep') || this.getText('common.edit'),
                    language: this.config.language
                }
            });
            // NEW: Set CreatForm instance in factory to initialize processors
            this.factory.setCreatFormInstance(this);
            if (this.state.isSingleStep) {
                this.logger.info('Creating single step form');
                const singleStepContainer = this.createSingleStepForm();
                this.container.appendChild(singleStepContainer);
            } else {
                this.logger.info('Creating multi-step form');
                const formConfig = {
                    showProgress: true,
                    saveProgress: false,
                    validateOnNext: true,
                    steps: this.createFormSteps(),
                    onSubmit: this.handleSubmission,
                    onStepChange: (stepIndex, stepInstance) => {
                        this.state.currentStep = stepIndex;
                        this.logger.info(`Step changed to ${stepIndex + 1}`);
                        if (this.isBookingForm && this.formValues.serviceSelection) {
                            const calendarStepIndex = this.formConfig.steps.findIndex(step =>
                                step.fields.some(field => field.type === 'calendar')
                            );
                            if (stepIndex === calendarStepIndex) {
                                this.logger.info('Reached calendar step, applying service configuration...');
                                setTimeout(() => {
                                    this.updateCalendarConfiguration(this.formValues.serviceSelection);
                                }, 100);
                            }
                        }
                        if (stepInstance && stepInstance.fieldInstances) {
                            stepInstance.fieldInstances.forEach(fieldInstance => {
                                if (fieldInstance.autoSummary && fieldInstance.updateContent) {
                                    setTimeout(() => {
                                        fieldInstance.updateContent();
                                    }, 100);
                                }
                            });
                        }
                        // Call config onStepChange if provided
                        if (this.config.onStepChange) {
                            this.config.onStepChange(stepIndex, stepInstance);
                        }
                    }
                };
                this.multiStepForm = this.factory.createMultiStepForm(formConfig);
            }
            element.appendChild(this.container);
            this.setupSessionManagement();
            this.state.initialized = true;
            this.logger.success('🎊 Form rendered successfully with container-scoped CSS and session management!');
            return this.createPublicAPI();
        } catch (error) {
            this.logger.error('Failed to render form:', error);
            const errorMessage = this.isBookingForm ? 'Failed to load booking form' : 'Failed to load submission form';
            element.innerHTML = `<div class="error-state">${errorMessage}</div>`;
            return {
                destroy: () => {}
            };
        }
    }
    // ============================================================================
    // ENHANCED PUBLIC API (updated with new processor methods)
    // ============================================================================
    createPublicAPI() {
        return {
            destroy: () => this.destroy(),
            getCurrentStep: () => this.state.currentStep,
            getFormData: () => {
                if (this.state.isSingleStep && this.singleStepForm) {
                    const data = {};
                    this.singleStepForm.fieldInstances.forEach(field => {
                        data[field.name] = field.getValue();
                    });
                    return data;
                }
                return this.multiStepForm?.getFormData() || {};
            },
            // NEW: Enhanced data access methods using processor
            getDataProcessor: () => this.dataProcessor,
            getTransformerInstance: () => this.dataTransformerInstance,
            getFormatter: () => this.formatter,
            // NEW: Test data transformation with processor
            testDataTransformation: (testData) => {
                if (this.dataTransformerInstance) {
                    try {
                        return this.dataTransformerInstance.transform(testData);
                    } catch (error) {
                        this.logger.error('Error testing data transformation:', error);
                        return null;
                    }
                }
                return null;
            },
            // NEW: Process data like CustomField does
            processDataLikeCustomField: (testData) => {
                try {
                    return this.dataProcessor.processFormData(testData);
                } catch (error) {
                    this.logger.error('Error processing data like CustomField:', error);
                    return null;
                }
            },
            // Updated configuration info
            getConfig: () => ({
                webhookEnabled: this.config.webhookEnabled,
                voiceflowEnabled: this.config.voiceflowEnabled,
                useStructuredData: this.config.useStructuredData,
                formType: this.config.formType,
                formStructure: this.state.isSingleStep ? 'single' : 'multistep',
                showSubmitButton: this.config.showSubmitButton,
                hasDataTransformer: !!this.dataTransformerInstance,
                hasVoiceflowTransformer: typeof this.config.voiceflowDataTransformer === 'function',
                dataTransformerType: this.dataTransformerInstance?.constructor.name || 'none',
                usesFormDataProcessor: true // New flag
            }),
            // Enhanced testing and debugging methods
            testVoiceflowTransformer: (testData) => {
                if (this.config.voiceflowDataTransformer && typeof this.config.voiceflowDataTransformer === 'function') {
                    try {
                        return this.config.voiceflowDataTransformer(testData, testData, this);
                    } catch (error) {
                        this.logger.error('Error testing Voiceflow transformer:', error);
                        return null;
                    }
                }
                return null;
            },
            // Logging control methods
            enableLogging: () => {
                this.config.enableDetailedLogging = true;
                this.logger.info('Detailed logging enabled');
            },
            disableLogging: () => {
                this.config.enableDetailedLogging = false;
                console.log('📋 CreatForm: Detailed logging disabled');
            },
            // Data inspection methods
            inspectFormValues: () => {
                this.logger.info('Current form values:', this.formValues);
                return this.formValues;
            },
            inspectSubmissionData: () => {
                const data = this.state.isSingleStep ? this.getFormData() : this.multiStepForm?.getFormData() || {};
                const prepared = this.prepareDataForSubmission(data);
                this.logger.info('Prepared submission data:', prepared);
                return prepared;
            },
            // NEW: Inspect processed data
            inspectProcessedData: () => {
                const data = this.state.isSingleStep ? this.getFormData() : this.multiStepForm?.getFormData() || {};
                const processed = this.dataProcessor.processFormData(data);
                this.logger.info('Processed form data (like CustomField):', processed);
                return processed;
            },
            // Form manipulation methods
            submitForm: () => this.submitForm(),
            validateForm: () => this.validateForm(),
            reset: () => this.reset()
        };
    }
    // ============================================================================
    // UTILITY METHODS
    // ============================================================================
    reset() {
        this.logger.info('Resetting form...');
        this.clearSessionTimers();
        this.state = {
            ...this.state,
            initialized: false,
            formSubmitted: false,
            sessionExpired: false,
            currentStep: 0
        };
        if (this.state.isSingleStep && this.singleStepForm) {
            this.singleStepForm.fieldInstances.forEach(field => {
                field.setValue('');
                field.hideError();
            });
        } else if (this.multiStepForm) {
            this.multiStepForm.reset();
        }
        this.setupSessionManagement();
        this.logger.success('Form reset completed');
    }
    // UPDATED: Enhanced destroy method to clean up session elements
    destroy() {
        this.logger.info('Destroying form...');
        this.clearSessionTimers();
        
        // Clean up factory properly
        if (this.factory) {
            // Unregister all custom fields if needed
            if (this.factory.fieldRegistry) {
                this.factory.fieldRegistry = {};
            }
            this.factory.destroy();
        }
        
        // Clean up multi-step form
        if (this.multiStepForm) {
            this.multiStepForm.clearSavedProgress();
            // Destroy all field instances
            if (this.multiStepForm.stepInstances) {
                this.multiStepForm.stepInstances.forEach(step => {
                    if (step.fieldInstances) {
                        step.fieldInstances.forEach(field => {
                            if (typeof field.destroy === 'function') {
                                field.destroy();
                            }
                        });
                    }
                });
            }
        }
        
        // Clean up single-step form
        if (this.singleStepForm && this.singleStepForm.fieldInstances) {
            this.singleStepForm.fieldInstances.forEach(field => {
                if (typeof field.destroy === 'function') {
                    field.destroy();
                }
            });
        }
        
        this.elements.clear();
        
        // Clean up container-specific styles and session elements
        if (this.container) {
            const styleClass = this.isBookingForm ? 'booking-form-styles' : 'submission-form-styles';
            const containerStyle = this.container.querySelector(`.${styleClass}`);
            if (containerStyle) {
                containerStyle.remove();
            }
            
            // Remove session-related elements
            const sessionWarning = this.container.querySelector('.session-warning');
            const timeoutOverlay = this.container.querySelector('.timeout-overlay');
            if (sessionWarning) sessionWarning.remove();
            if (timeoutOverlay) timeoutOverlay.remove();
            
            this.container.remove();
        }
        
        // Clean up global styles and session elements (fallback)
        const styleClass = this.isBookingForm ? 'booking-form-styles' : 'submission-form-styles';
        document.querySelector(`.${styleClass}`)?.remove();
        document.querySelector('.session-warning')?.remove();
        
        // Clean up injected styles
        document.querySelector('#session-warning-styles')?.remove();
        document.querySelector('#timeout-overlay-styles')?.remove();
        document.querySelector('#success-screen-styles')?.remove();
        
        this.logger.success('Form destroyed successfully');
    }
}
/**
 * Enhanced CalendarField - Base class with optional service/provider selection
 * Replaces the need for three separate classes with configuration-driven approach
 */
        class CategoryItemFilterField extends BaseField {
    constructor(factory, config) {
        super(factory, config);
        
        // Core configuration
        this.language = config.language || 'fr';
        this.mode = config.mode || 'both'; // 'category-only', 'item-only', 'both'
        
        // Data configuration - Handle data reference
        if (typeof config.categoryItems === 'string') {
            // Reference to data in form - need to get it from factory or form
            this.rawCategoryItems = this.factory.getFormData?.(config.categoryItems) ||
                this.factory.formData?.[config.categoryItems] ||
                this.factory.data?.[config.categoryItems] || {};
        } else {
            this.rawCategoryItems = config.categoryItems || config.specialistsInfo || {};
        }
        
        this.availableCategories = [];
        this.filteredItems = [];
        this.allItems = [];
        
        // Selection state
        this.selectedCategory = config.selectedCategory || config.categoryName || '';
        this.selectedItemId = config.selectedItemId || '';
        this.selectedItem = null;
        
        // UI Configuration - ALL text must come from config
        this.categoryLabel = config.categoryLabel || 'Category';
        this.categoryPlaceholder = config.categoryPlaceholder || '-- Select --';
        this.itemLabel = config.itemLabel || 'Item';
        this.itemPlaceholder = config.itemPlaceholder || '-- Select --';
        
        // Error messages from config
        this.categoryErrorMessage = config.categoryErrorMessage || config.customErrorMessage || 'Please select a category';
        this.itemErrorMessage = config.itemErrorMessage || config.customErrorMessage || 'Please select an item';
        
        // Show/hide options
        this.showCategoryField = config.showCategoryField !== false && (this.mode === 'both' || this.mode === 'category-only');
        this.showItemField = config.showItemField !== false && (this.mode === 'both' || this.mode === 'item-only');
        
        // Auto-selection behavior
        this.autoSelectSingleCategory = config.autoSelectSingleCategory !== false;
        this.autoSelectSingleItem = config.autoSelectSingleItem !== false;
        
        // Callback functions
        this.onCategoryChange = config.onCategoryChange || null;
        this.onItemChange = config.onItemChange || null;
        this.onSelectionComplete = config.onSelectionComplete || null;
        
        // Summary display function
        this.getSummaryDisplay = config.getSummaryDisplay || null;
        this.renderSeparateSummaryFields = config.renderSeparateSummaryFields || false;
        
        // Field instances
        this.categorySelectField = null;
        this.itemSelectField = null;
        
        this.init();
    }
    
    // Method to get data from form context
    getDataFromForm() {
        if (this.factory && this.factory.form && this.factory.form.data) {
            return this.factory.form.data.categoryItems || {};
        }
        if (window.ContactFormExtension && window.ContactFormExtension.FORM_DATA) {
            return window.ContactFormExtension.FORM_DATA.categoryItems || {};
        }
        return this.rawCategoryItems;
    }
    
    init() {
        // Ensure we have the correct data
        if (!this.rawCategoryItems || Object.keys(this.rawCategoryItems).length === 0) {
            this.rawCategoryItems = this.getDataFromForm();
        }
        
        this.availableCategories = this.extractAvailableCategories(this.rawCategoryItems);
        this.allItems = this.extractAllItems(this.rawCategoryItems);
        
        if (this.autoSelectSingleCategory && this.availableCategories.length === 1 && !this.selectedCategory) {
            this.selectedCategory = this.availableCategories[0].name;
        }
        
        if (this.selectedCategory) {
            this.filteredItems = this.filterItemsByCategory(this.selectedCategory);
            if (this.autoSelectSingleItem && this.filteredItems.length === 1 && !this.selectedItemId) {
                this.selectedItemId = this.filteredItems[0].id;
                this.selectedItem = this.filteredItems[0];
            }
        } else {
            this.filteredItems = this.allItems;
        }
        
        if (this.selectedItemId && !this.selectedItem) {
            this.selectedItem = this.filteredItems.find(p => p.id === this.selectedItemId);
        }
    }
    
    extractAvailableCategories(rawItems) {
        const categorySet = new Set();
        try {
            // Handle object format: { 'Item Name': { categories: {...} } }
            Object.entries(rawItems).forEach(([itemName, itemData]) => {
                if (itemData && itemData.categories) {
                    Object.keys(itemData.categories).forEach(category => {
                        categorySet.add(category);
                    });
                }
            });
        } catch (error) {
            console.error('Error extracting categories:', error);
        }
        
        const categories = Array.from(categorySet)
            .sort()
            .map(category => ({
                id: this.slugify(category),
                name: category,
                displayName: category
            }));
        
        return categories;
    }
    
    extractAllItems(rawItems) {
        const allItems = [];
        try {
            Object.entries(rawItems).forEach(([itemName, itemData]) => {
                if (itemData) {
                    allItems.push({
                        id: this.slugify(itemName),
                        name: itemName,
                        displayName: itemName,
                        description: itemData.description || itemData.specialty || "",
                        categories: itemData.categories || {},
                        rawData: itemData
                    });
                }
            });
        } catch (error) {
            console.error('Error extracting items:', error);
        }
        
        return allItems;
    }
    
    filterItemsByCategory(categoryName) {
        if (!categoryName || !this.rawCategoryItems) {
            return this.allItems;
        }
        
        const filteredItems = [];
        Object.entries(this.rawCategoryItems).forEach(([itemName, itemData]) => {
            if (itemData.categories && itemData.categories[categoryName]) {
                const categoryConfig = itemData.categories[categoryName];
                filteredItems.push({
                    id: this.slugify(itemName),
                    name: itemName,
                    displayName: itemName,
                    description: itemData.description || itemData.specialty || "",
                    categoryConfig: categoryConfig,
                    allCategories: itemData.categories,
                    rawData: itemData
                });
            }
        });
        
        return filteredItems;
    }
    
    slugify(text) {
        return text
            .toLowerCase()
            .replace(/[^\w\s-]/g, '')
            .replace(/[\s_-]+/g, '-')
            .replace(/^-+|-+$/g, '');
    }
    
    selectCategory(categoryId) {
        const category = this.availableCategories.find(s => s.id === categoryId);
        if (!category) {
            console.error('Category not found:', categoryId);
            return;
        }
        
        this.selectedCategory = category.name;
        this.filteredItems = this.filterItemsByCategory(category.name);
        
        if (this.selectedItemId) {
            const stillValid = this.filteredItems.find(p => p.id === this.selectedItemId);
            if (!stillValid) {
                this.selectedItemId = '';
                this.selectedItem = null;
            }
        }
        
        if (this.autoSelectSingleItem && this.filteredItems.length === 1) {
            this.selectedItemId = this.filteredItems[0].id;
            this.selectedItem = this.filteredItems[0];
            if (this.itemSelectField) {
                this.itemSelectField.setValue(this.selectedItemId);
            }
        }
        
        this.showItemSelection();
        this.updateItemOptions();
        
        if (this.onCategoryChange) {
            this.onCategoryChange(category, this.filteredItems);
        }
        
        this.checkSelectionComplete();
        this.updateValue();
    }
    
    selectItem(itemId) {
        const item = this.filteredItems.find(p => p.id === itemId) ||
            this.allItems.find(p => p.id === itemId);
        
        if (!item) {
            console.error('Item not found:', itemId);
            return;
        }
        
        this.selectedItemId = itemId;
        this.selectedItem = item;
        
        if (this.onItemChange) {
            this.onItemChange(item);
        }
        
        this.checkSelectionComplete();
        this.updateValue();
    }
    
    checkSelectionComplete() {
        const isComplete = this.isSelectionComplete();
        if (isComplete && this.onSelectionComplete) {
            this.onSelectionComplete({
                category: this.selectedCategory,
                item: this.selectedItem,
                categoryConfig: this.selectedItem?.categoryConfig
            });
        }
    }
    
    isSelectionComplete() {
        let complete = true;
        
        if (this.showCategoryField && this.required && !this.selectedCategory) {
            complete = false;
        }
        
        if (this.showItemField && this.required && !this.selectedItemId) {
            complete = false;
        }
        
        return complete;
    }
    
    createCategorySelectField() {
        if (!this.showCategoryField) return null;
        
        this.categorySelectField = new SingleSelectField(this.factory, {
            id: `${this.id}-category`,
            name: `${this.name}_category`,
            label: this.categoryLabel,
            placeholder: this.categoryPlaceholder,
            options: this.availableCategories,
            required: this.required,
            row: 'categorySelectField',
            onChange: (value) => this.selectCategory(value)
        });
        
        if (this.selectedCategory) {
            const categoryOption = this.availableCategories.find(s => s.name === this.selectedCategory);
            if (categoryOption) {
                this.categorySelectField.setValue(categoryOption.id);
            }
        }
        
        return this.categorySelectField;
    }
    
    createItemSelectField() {
        if (!this.showItemField) return null;
        
        this.itemSelectField = new SingleSelectField(this.factory, {
            id: `${this.id}-item`,
            name: `${this.name}_item`,
            label: this.itemLabel,
            placeholder: this.itemPlaceholder,
            options: this.filteredItems,
            required: this.required,
            row: 'itemSelectField',
            onChange: (value) => this.selectItem(value)
        });
        
        if (this.selectedItemId) {
            this.itemSelectField.setValue(this.selectedItemId);
        }
        
        return this.itemSelectField;
    }
    
    showItemSelection() {
        const itemContainer = this.element.querySelector('.item-select-container');
        if (itemContainer) {
            itemContainer.style.display = 'block';
            // Add smooth transition effect
            itemContainer.style.opacity = '0';
            itemContainer.style.transform = 'translateY(-10px)';
            
            // Animate in
            setTimeout(() => {
                itemContainer.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
                itemContainer.style.opacity = '1';
                itemContainer.style.transform = 'translateY(0)';
            }, 10);
        }
    }
    
    updateItemOptions() {
        if (!this.itemSelectField) return;
        
        const itemContainer = this.element.querySelector('.item-select-container');
        if (!itemContainer) return;
        
        const currentValue = this.selectedItemId;
        itemContainer.innerHTML = '';
        
        this.itemSelectField = new SingleSelectField(this.factory, {
            id: `${this.id}-item`,
            name: `${this.name}_item`,
            label: this.itemLabel,
            placeholder: this.itemPlaceholder,
            options: this.filteredItems,
            required: this.required,
            onChange: (value) => this.selectItem(value)
        });
        
        const newFieldElement = this.itemSelectField.render();
        itemContainer.appendChild(newFieldElement);
        
        if (currentValue && this.filteredItems.find(p => p.id === currentValue)) {
            this.itemSelectField.setValue(currentValue);
        }
    }
    
    validate() {
        if (!this.required) return true;
        
        if (this.showCategoryField && !this.selectedCategory) {
            this.showError(this.categoryErrorMessage);
            return false;
        }
        
        if (this.showItemField && !this.selectedItemId) {
            this.showError(this.itemErrorMessage);
            return false;
        }
        
        this.hideError();
        return true;
    }
    
    render() {
        const container = this.createContainer();
        
        // Add vertical spacing styles
        const styles = `
            <style>
                .category-item-filter {
                    display: flex;
                    flex-direction: column;
                    gap: 10px;
                }
                .category-item-filter .category-select-container {
                    margin-bottom: 0;
                }
                .category-item-filter .item-select-container {
                    margin-top: 0;
                    transition: opacity 0.3s ease, transform 0.3s ease;
                }
            </style>
        `;
        
        if (!document.querySelector('#category-item-filter-styles')) {
            const styleElement = document.createElement('div');
            styleElement.id = 'category-item-filter-styles';
            styleElement.innerHTML = styles;
            document.head.appendChild(styleElement.firstElementChild);
        }
        
        if (this.showCategoryField) {
            this.createCategorySelectField();
            const categoryFieldElement = this.categorySelectField.render();
            categoryFieldElement.classList.add('category-select-container');
            container.appendChild(categoryFieldElement);
        }
        
        if (this.showItemField) {
            this.createItemSelectField();
            const itemFieldElement = this.itemSelectField.render();
            itemFieldElement.classList.add('item-select-container');
            
            if (!this.selectedCategory && this.showCategoryField) {
                itemFieldElement.style.display = 'none';
            }
            
            container.appendChild(itemFieldElement);
        }
        
        const filterContainer = document.createElement('div');
        filterContainer.className = 'category-item-filter';
        
        while (container.firstChild) {
            filterContainer.appendChild(container.firstChild);
        }
        
        container.appendChild(filterContainer);
        
        const errorElement = this.createErrorElement();
        container.appendChild(errorElement);
        
        this.element = container;
        this.element.fieldInstance = this;
        
        return this.element;
    }
    
    getValue() {
        const value = {
            category: this.selectedCategory || '',
            item: this.selectedItem?.displayName || '',
            // Flag to indicate this should be displayed as separate fields
            _separateFields: true,
            // Provide field labels for display  
            _fieldLabels: {
                category: this.categoryLabel || 'Category',
                item: this.itemLabel || 'Item'
            },
            // Enhanced toString method for better string conversion
            toString: function () {
                const parts = [];
                if (this.category && String(this.category).trim() !== '') {
                    parts.push(String(this.category));
                }
                if (this.item && String(this.item).trim() !== '') {
                    parts.push(String(this.item));
                }
                return parts.length > 0 ? parts.join(' - ') : '';
            },
            // Display text property for formatters
            get displayText() {
                return this.toString();
            },
            // For summary display
            getSummaryDisplay: function () {
                const parts = [];
                if (this.category && String(this.category).trim() !== '') {
                    parts.push(`${this._fieldLabels.category}: ${this.category}`);
                }
                if (this.item && String(this.item).trim() !== '') {
                    parts.push(`${this._fieldLabels.item}: ${this.item}`);
                }
                return parts.join('\n');
            },
            // Check if has meaningful content
            hasContent: function () {
                return !!(this.category || this.item);
            },
            // Get simple string representation
            getSimpleString: function () {
                return this.toString();
            }
        };
        
        // Ensure the toString method is properly bound
        Object.defineProperty(value, 'toString', {
            value: value.toString.bind(value),
            writable: false,
            enumerable: false,
            configurable: false
        });
        
        return value;
    }
    
    getProcessedValue() {
        return {
            selectedCategory: this.selectedCategory || '',
            selectedCategoryId: this.selectedCategory ? this.slugify(this.selectedCategory) : '',
            selectedItemId: this.selectedItemId || '',
            selectedItem: this.selectedItem ? {
                id: this.selectedItem.id,
                name: this.selectedItem.name,
                displayName: this.selectedItem.displayName
            } : null,
            displayText: this.getDisplayText(),
            isComplete: this.isSelectionComplete()
        };
    }
    
    getDisplayText() {
        const parts = [];
        if (this.selectedCategory && String(this.selectedCategory).trim() !== '') {
            parts.push(String(this.selectedCategory));
        }
        if (this.selectedItem && this.selectedItem.displayName && String(this.selectedItem.displayName).trim() !== '') {
            parts.push(String(this.selectedItem.displayName));
        }
        return parts.length > 0 ? parts.join(' - ') : '';
    }
    
    getSummaryFields() {
        const fields = [];
        
        if (this.selectedCategory && String(this.selectedCategory).trim() !== '') {
            fields.push({
                label: this.categoryLabel || 'Category',
                value: this.selectedCategory,
                key: 'category'
            });
        }
        
        if (this.selectedItem?.displayName && String(this.selectedItem.displayName).trim() !== '') {
            fields.push({
                label: this.itemLabel || 'Item',
                value: this.selectedItem.displayName,
                key: 'item'
            });
        }
        
        return fields;
    }
    
    setValue(value) {
        // Reset first
        this.selectedCategory = '';
        this.selectedItemId = '';
        this.selectedItem = null;
        
        if (value && typeof value === 'object') {
            // Handle processed value format
            if (value.selectedCategory && this.showCategoryField) {
                const categoryOption = this.availableCategories.find(s => s.name === value.selectedCategory);
                if (categoryOption) {
                    this.selectCategory(categoryOption.id);
                    if (this.categorySelectField) {
                        this.categorySelectField.setValue(categoryOption.id);
                    }
                }
            }
            
            // Handle category field from getValue format
            if (value.category && this.showCategoryField && !value.selectedCategory) {
                const categoryOption = this.availableCategories.find(s => s.name === value.category);
                if (categoryOption) {
                    this.selectCategory(categoryOption.id);
                    if (this.categorySelectField) {
                        this.categorySelectField.setValue(categoryOption.id);
                    }
                }
            }
            
            if (value.selectedItemId && this.showItemField) {
                this.selectItem(value.selectedItemId);
                if (this.itemSelectField) {
                    this.itemSelectField.setValue(value.selectedItemId);
                }
            }
        } else if (typeof value === 'string') {
            // Handle string values (might be display text)
            console.log('CategoryItemFilterField: String value set:', value);
        }
        
        this.updateValue();
    }
    
    getSummaryValue() {
        const parts = [];
        if (this.selectedCategory) {
            parts.push(`${this.categoryLabel}: ${this.selectedCategory}`);
        }
        if (this.selectedItem && this.selectedItem.displayName) {
            parts.push(`${this.itemLabel}: ${this.selectedItem.displayName}`);
        }
        return parts.join('\n');
    }
    
    getDataValue() {
        return {
            selectedCategory: this.selectedCategory,
            selectedCategoryId: this.selectedCategory ? this.slugify(this.selectedCategory) : '',
            selectedItemId: this.selectedItemId,
            selectedItem: this.selectedItem,
            filteredItems: this.filteredItems,
            categoryConfig: this.selectedItem?.categoryConfig || null,
            isComplete: this.isSelectionComplete(),
            displayText: this.getDisplayText()
        };
    }
    
    toString() {
        return this.getDisplayText();
    }
    
    updateValue() {
        this.handleChange();
    }
    
    reset() {
        this.selectedCategory = '';
        this.selectedItemId = '';
        this.selectedItem = null;
        this.filteredItems = this.allItems;
        
        if (this.categorySelectField) {
            this.categorySelectField.setValue('');
        }
        
        if (this.itemSelectField) {
            this.itemSelectField.setValue('');
            this.updateItemOptions();
        }
        
        const itemContainer = this.element?.querySelector('.item-select-container');
        if (itemContainer) {
            itemContainer.style.display = 'none';
        }
        
        this.updateValue();
    }
    
    destroy() {
        if (this.categorySelectField && typeof this.categorySelectField.destroy === 'function') {
            this.categorySelectField.destroy();
        }
        
        if (this.itemSelectField && typeof this.itemSelectField.destroy === 'function') {
            this.itemSelectField.destroy();
        }
        
        super.destroy();
    }
}


class CalendarField extends BaseField {
    constructor(factory, config) {
        super(factory, config);
        
        // Generate unique instance ID for debugging
        this.instanceId = `calendar_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        console.log(`📅 Creating new CalendarField instance: ${this.instanceId}`);
        
        // Core calendar configuration
        this.timezone = config.timezone || 'America/Toronto';
        this.language = config.language || 'en';
        this.locale = config.locale || 'en-US';
        this.mode = config.mode || 'booking';
        
        // Reschedule mode configuration  
        this.currentAppointment = config.currentAppointment || null;
        
        // Selection mode determines what UI to show
        this.selectionMode = config.selectionMode || 'none';
        
        // Category and item data
        this.rawCategoryItems = config.categoryItems || config.specialistsInfo || {};
        this.availableCategories = [];
        this.filteredItems = [];
        
        // Selection state
        this.selectedCategory = config.selectedCategory || config.categoryName || '';
        this.selectedItemId = config.selectedItemId || '';
        
        // Current active configuration
        this.currentItem = null;
        this.currentCategoryConfig = null;
        this.apiKey = config.apiKey || '';
        this.eventTypeId = config.eventTypeId || null;
        this.eventTypeSlug = config.eventTypeSlug || '';
        this.scheduleId = config.scheduleId || null;
        this.eventName = config.eventName || '';
        
        // Direct item configuration
        this.specialist = config.specialist || '';
        
        // UI Configuration
        this.headerIcon = config.headerIcon || 'CALENDAR';
        this.showItemInfo = config.showItemInfo !== false;
        this.placeholderText = config.placeholderText || '';
        this.showPlaceholder = config.showPlaceholder || false;
        this.placeholderMessage = config.placeholderMessage || '';
        
        // Translated texts
        this.texts = {
            selectCategory: config.texts?.selectCategory || "Select a category",
            selectCategoryPlaceholder: config.texts?.selectCategoryPlaceholder || "-- Select a category --",
            selectItem: config.texts?.selectItem || "Select an item",
            selectItemPlaceholder: config.texts?.selectItemPlaceholder || "-- Select an item --",
            selectDate: config.texts?.selectDate || "Select a date to view available times",
            availableTimesFor: config.texts?.availableTimesFor || "Available times for",
            noAvailableSlots: config.texts?.noAvailableSlots || "No available time slots for this date",
            pleaseSelectDate: config.texts?.pleaseSelectDate || "Please select a date first",
            pleaseSelectCategory: config.texts?.pleaseSelectCategory || "Please select a category first",
            pleaseSelectItem: config.texts?.pleaseSelectItem || "Please select an item first",
            currentAppointment: config.texts?.currentAppointment || "Current Appointment",
            newAppointment: config.texts?.newAppointment || "New Appointment",
            loadingAvailability: config.texts?.loadingAvailability || "Loading availability...",
            loading: config.texts?.loading || "Loading...",
            weekdays: config.texts?.weekdays || ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
        };
        
        // Error messages
        this.errorTexts = {
            categoryRequired: config.errorTexts?.categoryRequired || 'Please select a category',
            itemRequired: config.errorTexts?.itemRequired || 'Please select an item',
            dateTimeRequired: config.errorTexts?.dateTimeRequired || 'Please select date and time'
        };
        
        // Selection fields
        this.categorySelectField = null;
        this.itemSelectField = null;
        
        // Fresh calendar state - no shared state
        this.state = this.createFreshState();
        
        // Store full config
        this.fullConfig = config;
        
        // Initialize based on configuration
        this.init();
    }
    
    // Create fresh state object
    createFreshState() {
        return {
            currentDate: new Date(),
            selectedDate: null,
            selectedTime: null,
            availableSlots: {},
            workingDays: [1, 2, 3, 4, 5],
            isConfirmed: false,
            isLoading: false,
            initialized: false
        };
    }
    
    // Reconfigure calendar with new settings
    async reconfigure(newConfig) {
        console.log(`📅 [${this.instanceId}] Reconfiguring calendar`, newConfig);
        
        // Reset state completely
        this.state = this.createFreshState();
        
        // Update configuration
        this.apiKey = newConfig.apiKey || this.apiKey;
        this.eventTypeId = newConfig.eventTypeId || this.eventTypeId;
        this.eventTypeSlug = newConfig.eventTypeSlug || this.eventTypeSlug;
        this.scheduleId = newConfig.scheduleId || this.scheduleId;
        this.eventName = newConfig.eventName || this.eventName;
        this.specialist = newConfig.specialist || this.specialist;
        this.selectedCategory = newConfig.selectedCategory || this.selectedCategory;
        this.timezone = newConfig.timezone || this.timezone;
        this.language = newConfig.language || this.language;
        this.locale = newConfig.locale || this.locale;
        
        // Clear any cached data
        this.currentItem = null;
        this.currentCategoryConfig = null;
        
        // Re-initialize
        await this.init();
        
        // Re-render if element exists
        if (this.element) {
            this.updateCalendarHeader();
            this.renderCalendarData();
        }
    }
    
    // Initialize based on selection mode
    async init() {
        console.log(`📅 [${this.instanceId}] Initializing with mode: ${this.selectionMode}`);
        
        if (this.selectionMode === 'none') {
            // Direct calendar mode
            if (!this.showPlaceholder) {
                await this.initializeCalendar();
            }
        } else if (this.selectionMode === 'item') {
            // Item selection mode
            this.initializeItemSelection();
        } else if (this.selectionMode === 'category-item') {
            // Category + item selection mode
            this.initializeCategoryAndItemSelection();
        }
        
        this.state.initialized = true;
    }
    
    // Direct calendar initialization
    async initializeCalendar() {
        console.log(`📅 [${this.instanceId}] Initializing calendar with API key: ${this.apiKey?.substring(0, 10)}...`);
        
        // Clear any existing data
        this.state.availableSlots = {};
        this.state.selectedDate = null;
        this.state.selectedTime = null;
        
        if (this.scheduleId && this.apiKey) {
            try {
                this.state.isLoading = true;
                this.state.workingDays = await this.fetchWorkingDays(this.scheduleId);
                
                if (!this.state.selectedDate) {
                    this.state.selectedDate = this.getDefaultActiveDay();
                    const dayKey = this.formatDate(this.state.selectedDate);
                    const slots = await this.fetchAvailableSlots(dayKey);
                    this.state.availableSlots[dayKey] = slots;
                }
                
                this.state.isLoading = false;
                console.log(`📅 [${this.instanceId}] Calendar initialized successfully`);
            } catch (error) {
                console.error(`📅 [${this.instanceId}] Error initializing calendar:`, error);
                this.state.isLoading = false;
            }
        } else {
            console.warn(`📅 [${this.instanceId}] Missing scheduleId or apiKey for initialization`);
        }
    }
    
    // Item selection initialization
    initializeItemSelection() {
        if (!this.selectedCategory) {
            console.error(`📅 [${this.instanceId}] Item selection mode requires selectedCategory`);
            return;
        }
        
        this.filteredItems = this.filterItemsByCategory(this.selectedCategory);
        
        // Auto-select if only one item
        if (this.filteredItems.length === 1) {
            this.selectedItemId = this.filteredItems[0].id;
            this.selectItem(this.selectedItemId, false);
        } else if (this.selectedItemId) {
            this.selectItem(this.selectedItemId, false);
        }
    }
    
    // Category + item selection initialization
    initializeCategoryAndItemSelection() {
        this.availableCategories = this.extractAvailableCategories(this.rawCategoryItems);
        
        if (this.selectedCategory) {
            this.filteredItems = this.filterItemsByCategory(this.selectedCategory);
            if (this.selectedItemId) {
                this.selectItem(this.selectedItemId, false);
            }
        }
    }
    
    // Extract all available categories from items data
    extractAvailableCategories(rawItems) {
        const categorySet = new Set();
        
        try {
            const itemsArray = Array.isArray(rawItems) ? rawItems : Object.entries(rawItems);
            
            itemsArray.forEach(([itemName, itemData]) => {
                if (Array.isArray(rawItems) && typeof itemName === 'object') {
                    itemData = itemName;
                    itemName = itemData.name || itemData.id;
                }
                
                if (itemData && itemData.categories) {
                    Object.keys(itemData.categories).forEach(category => {
                        categorySet.add(category);
                    });
                }
            });
        } catch (error) {
            console.error(`📅 [${this.instanceId}] Error extracting categories:`, error);
        }
        
        return Array.from(categorySet).sort().map(category => ({
            id: this.slugify(category),
            name: category,
            displayName: category
        }));
    }
    
    // Filter items that offer the specific category
    filterItemsByCategory(categoryName) {
        if (!categoryName || !this.rawCategoryItems) {
            return [];
        }
        
        const filteredItems = [];
        const itemsArray = Array.isArray(this.rawCategoryItems) ? 
            this.rawCategoryItems : Object.entries(this.rawCategoryItems);
        
        itemsArray.forEach(([itemName, itemData]) => {
            if (Array.isArray(this.rawCategoryItems) && typeof itemName === 'object') {
                itemData = itemName;
                itemName = itemData.name || itemData.id;
            }
            
            if (itemData.categories && itemData.categories[categoryName]) {
                const categoryConfig = itemData.categories[categoryName];
                filteredItems.push({
                    id: this.slugify(itemName),
                    name: itemName,
                    displayName: itemName,
                    description: itemData.description || itemData.specialty || "",
                    apiKey: itemData.apiKey || "",
                    scheduleId: itemData.scheduleId || "",
                    eventTypeId: categoryConfig.eventId || "",
                    eventTypeSlug: categoryConfig.eventSlug || "",
                    eventName: categoryName,
                    link: categoryConfig.link || "",
                    categoryConfig: categoryConfig,
                    allCategories: itemData.categories
                });
            }
        });
        
        return filteredItems;
    }
    
    // Helper to create URL-friendly slugs
    slugify(text) {
        return text
            .toLowerCase()
            .replace(/[^\w\s-]/g, '')
            .replace(/[\s_-]+/g, '-')
            .replace(/^-+|-+$/g, '');
    }
    
    // Select category
    selectCategory(categoryId) {
        const category = this.availableCategories.find(s => s.id === categoryId);
        if (!category) {
            console.error(`📅 [${this.instanceId}] Category not found:`, categoryId);
            return;
        }
        
        this.selectedCategory = category.name;
        this.filteredItems = this.filterItemsByCategory(category.name);
        
        // Update item dropdown
        this.updateItemOptions();
        this.showItemSelection();
        
        // Reset item and calendar state
        this.resetItemAndCalendar();
        
        // Auto-select if only one item
        if (this.filteredItems.length === 1) {
            this.selectItem(this.filteredItems[0].id);
            if (this.itemSelectField) {
                this.itemSelectField.setValue(this.filteredItems[0].id);
            }
        }
        
        this.updateCalendarHeader();
        this.renderCalendarData();
    }
    
    // Select item
    async selectItem(itemId, shouldUpdateUI = true) {
        const item = this.filteredItems.find(p => p.id === itemId);
        if (!item) {
            console.error(`📅 [${this.instanceId}] Item not found:`, itemId);
            return;
        }
        
        console.log(`📅 [${this.instanceId}] Selecting item:`, itemId);
        
        // Update current configuration
        this.selectedItemId = itemId;
        this.currentItem = item;
        this.currentCategoryConfig = item.categoryConfig;
        this.apiKey = item.apiKey || '';
        this.eventTypeId = item.eventTypeId || null;
        this.eventTypeSlug = item.eventTypeSlug || '';
        this.scheduleId = item.scheduleId || null;
        this.eventName = item.eventName || this.selectedCategory || '';
        
        // Reset calendar state
        this.resetCalendarState();
        
        if (shouldUpdateUI && this.element) {
            this.showLoadingState();
        }
        
        // Initialize calendar with new item
        await this.initializeCalendar();
        
        if (shouldUpdateUI && this.element) {
            this.updateCalendarHeader();
            this.renderCalendarData();
        }
        
        this.updateValue();
        
        if (this.fullConfig.onItemChange) {
            this.fullConfig.onItemChange(item);
        }
    }
    
    // Create category selection field
    createCategorySelectField() {
        if (this.selectionMode !== 'category-item') return null;
        
        this.categorySelectField = new SingleSelectField(this.factory, {
            id: `${this.id}-category`,
            name: `${this.name}_category`,
            label: this.texts.selectCategory,
            placeholder: this.texts.selectCategoryPlaceholder,
            options: this.availableCategories,
            required: true,
            onChange: (value) => this.selectCategory(value)
        });
        
        if (this.selectedCategory) {
            const categoryOption = this.availableCategories.find(s => s.name === this.selectedCategory);
            if (categoryOption) {
                this.categorySelectField.setValue(categoryOption.id);
            }
        }
        
        return this.categorySelectField;
    }
    
    // Create item selection field
    createItemSelectField() {
        if (this.selectionMode === 'none') return null;
        
        this.itemSelectField = new SingleSelectField(this.factory, {
            id: `${this.id}-item`,
            name: `${this.name}_item`,
            label: this.texts.selectItem,
            placeholder: this.texts.selectItemPlaceholder,
            options: this.filteredItems,
            required: true,
            onChange: (value) => this.selectItem(value)
        });
        
        if (this.selectedItemId) {
            this.itemSelectField.setValue(this.selectedItemId);
        }
        
        return this.itemSelectField;
    }
    
    // Update item options dynamically
    updateItemOptions() {
        if (!this.itemSelectField) return;
        
        const itemContainer = this.element.querySelector('.item-select-container');
        if (!itemContainer) return;
        
        const currentValue = this.selectedItemId;
        itemContainer.innerHTML = '';
        
        this.itemSelectField = new SingleSelectField(this.factory, {
            id: `${this.id}-item`,
            name: `${this.name}_item`,
            label: this.texts.selectItem,
            placeholder: this.texts.selectItemPlaceholder,
            options: this.filteredItems,
            required: true,
            onChange: (value) => this.selectItem(value)
        });
        
        const newFieldElement = this.itemSelectField.render();
        newFieldElement.className = 'item-select-container';
        itemContainer.parentNode.replaceChild(newFieldElement, itemContainer);
        
        if (currentValue && this.filteredItems.find(p => p.id === currentValue)) {
            this.itemSelectField.setValue(currentValue);
        }
    }
    
    // Show item selection container
    showItemSelection() {
        const itemContainer = this.element.querySelector('.item-select-container');
        if (itemContainer) {
            itemContainer.style.display = 'block';
        }
    }
    
    // State management
    resetItemAndCalendar() {
        this.selectedItemId = '';
        this.currentItem = null;
        this.resetCalendarState();
    }
    
    resetCalendarState() {
        this.state.selectedDate = null;
        this.state.selectedTime = null;
        this.state.availableSlots = {};
        this.state.isLoading = false;
    }
    
    showLoadingState() {
        const daysEl = this.element.querySelector('.days');
        const timeSlotsEl = this.element.querySelector('.time-slots');
        
        if (daysEl) {
            daysEl.innerHTML = `<div class="loading-message">${this.texts.loadingAvailability}</div>`;
        }
        if (timeSlotsEl) {
            timeSlotsEl.innerHTML = `<div class="loading-message">${this.texts.loading}</div>`;
        }
    }
    
    updateCalendarHeader() {
        if (!this.element) return;
        
        const headerElement = this.element.querySelector('.calendar-title');
        if (headerElement) {
            headerElement.innerHTML = this.generateCalendarHeader();
        }
    }
    
    // Validation
    validate() {
        // Check category selection if required
        if (this.selectionMode === 'category-item' && !this.selectedCategory) {
            this.showError(this.getFieldErrorMessage('categoryRequired') || this.errorTexts.categoryRequired);
            return false;
        }
        
        // Check item selection if required
        if ((this.selectionMode === 'item' || this.selectionMode === 'category-item') && !this.selectedItemId) {
            this.showError(this.getFieldErrorMessage('itemRequired') || this.errorTexts.itemRequired);
            return false;
        }
        
        // Check date and time selection
        const isDateTimeValid = !!(this.state.selectedDate && this.state.selectedTime);
        if (this.required && !isDateTimeValid) {
            this.showError(this.getFieldErrorMessage('dateTimeRequired') || this.errorTexts.dateTimeRequired);
            return false;
        }
        
        this.hideError();
        return true;
    }
    
    // Calendar core methods
    formatDate(date) {
        const d = new Date(date);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, "0");
        const day = String(d.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
    }
    
    isSameDay(date1, date2) {
        if (!date1 || !date2) return false;
        return this.formatDate(date1) === this.formatDate(date2);
    }
    
    getDefaultActiveDay() {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        if (this.state.workingDays.includes(today.getDay())) return today;
        
        const next = new Date(today);
        let daysChecked = 0;
        
        while (!this.state.workingDays.includes(next.getDay()) && daysChecked < 14) {
            next.setDate(next.getDate() + 1);
            daysChecked++;
        }
        
        return next;
    }
    
    async fetchWorkingDays(scheduleId) {
        if (!this.apiKey || !scheduleId) return [1, 2, 3, 4, 5];
        
        try {
            const res = await fetch(`https://api.cal.com/v2/schedules/${scheduleId}`, {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${this.apiKey}`,
                    "cal-api-version": "2024-06-11",
                    "Content-Type": "application/json"
                }
            });
            
            if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
            
            const data = await res.json();
            const availability = data.data?.availability || [];
            
            const dayNameToNumber = {
                "Sunday": 0,
                "Monday": 1,
                "Tuesday": 2,
                "Wednesday": 3,
                "Thursday": 4,
                "Friday": 5,
                "Saturday": 6
            };
            
            const workingDaysSet = new Set();
            availability.forEach(item => {
                if (Array.isArray(item.days)) {
                    item.days.forEach(dayName => {
                        const dayNum = dayNameToNumber[dayName];
                        if (dayNum !== undefined) {
                            workingDaysSet.add(dayNum);
                        }
                    });
                }
            });
            
            return Array.from(workingDaysSet);
        } catch (err) {
            console.error(`📅 [${this.instanceId}] Error fetching schedule:`, err);
            return [1, 2, 3, 4, 5];
        }
    }
    
    async fetchAvailableSlots(selectedDateISO) {
        if (!this.apiKey || !this.eventTypeId || !this.eventTypeSlug) return [];
        
        const start = new Date(selectedDateISO);
        start.setUTCHours(0, 0, 0, 0);
        const end = new Date(selectedDateISO);
        end.setUTCHours(23, 59, 59, 999);
        
        const url = `https://api.cal.com/v2/slots/available?startTime=${start.toISOString()}&endTime=${end.toISOString()}&eventTypeId=${this.eventTypeId}&eventTypeSlug=${this.eventTypeSlug}`;
        
        try {
            const res = await fetch(url, {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${this.apiKey}`,
                    "cal-api-version": "2024-08-13",
                    "Content-Type": "application/json"
                }
            });
            
            if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
            
            const responseBody = await res.json();
            if (responseBody.status !== "success") {
                throw new Error(`Cal.com returned error: ${JSON.stringify(responseBody)}`);
            }
            
            const slotsObj = responseBody.data?.slots || {};
            const slotsForDate = slotsObj[selectedDateISO] || [];
            
            return slotsForDate.map(slot => slot.time);
        } catch (err) {
            console.error(`📅 [${this.instanceId}] Error fetching available slots:`, err);
            return [];
        }
    }
    
    async createBooking(startTimeISO, fullName, email) {
        if (!this.apiKey || !this.eventTypeId) {
            throw new Error('Missing API key or event type ID');
        }
        
        try {
            const url = `https://api.cal.com/v2/bookings`;
            const body = {
                start: startTimeISO,
                attendee: {
                    name: fullName,
                    email: email,
                    timeZone: this.timezone
                },
                eventTypeId: Number(this.eventTypeId)
            };
            
            const res = await fetch(url, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${this.apiKey}`,
                    "cal-api-version": "2024-08-13",
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(body)
            });
            
            if (!res.ok) {
                throw new Error(`HTTP error! status: ${res.status}`);
            }
            
            const responseBody = await res.json();
            if (responseBody.status && responseBody.status !== "success") {
                throw new Error(`Cal.com returned error: ${JSON.stringify(responseBody)}`);
            }
            
            return responseBody;
        } catch (err) {
            console.error(`📅 [${this.instanceId}] Booking error:`, err);
            return null;
        }
    }
    
    async rescheduleBooking(uid, startTimeISO, reason, rescheduledBy) {
        if (!this.apiKey || !uid) {
            throw new Error('Missing API key or booking UID');
        }
        
        try {
            const url = `https://api.cal.com/v2/bookings/${uid}/reschedule`;
            const body = {
                rescheduledBy: rescheduledBy,
                reschedulingReason: reason,
                start: startTimeISO
            };
            
            const res = await fetch(url, {
                method: 'POST',
                headers: {
                    "Authorization": `Bearer ${this.apiKey}`,
                    "cal-api-version": "2024-08-13",
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(body)
            });
            
            if (!res.ok) {
                throw new Error(`HTTP error! status: ${res.status}`);
            }
            
            const responseBody = await res.json();
            if (responseBody.status && responseBody.status !== "success") {
                throw new Error(`Cal.com returned error: ${JSON.stringify(responseBody)}`);
            }
            
            return responseBody;
        } catch (err) {
            console.error(`📅 [${this.instanceId}] Error rescheduling booking:`, err);
            return null;
        }
    }
    
    // Reschedule mode formatting
    formatCurrentAppointment() {
        if (!this.currentAppointment) return '';
        
        const date = new Date(this.currentAppointment);
        const formatOptions = {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit'
        };
        
        const formatter = new Intl.DateTimeFormat(this.locale, formatOptions);
        return formatter.format(date);
    }
    
    // Header generation
    generateCalendarHeader() {
        const iconSvg = this.factory.SVG_ICONS[this.headerIcon] || this.factory.SVG_ICONS.CALENDAR;
        
        if (!this.showItemInfo) {
            return '';
        }
        
        // Show placeholder if configured
        if (this.showPlaceholder && this.placeholderMessage) {
            return `
                <div class="calendar-title-content">
                    <div class="placeholder-message">${this.placeholderMessage}</div>
                </div>
            `;
        }
        
        // RESCHEDULE MODE
        if (this.mode === 'reschedule' && this.currentAppointment) {
            const displayItem = this.currentItem?.displayName ||
                this.currentItem?.name ||
                this.currentItem?.id ||
                this.specialist ||
                'Specialist';
            
            return `
                <div class="calendar-title-content">
                    <div class="service-provider">
                        <span class="provider-icon">${iconSvg}</span>
                        <div class="appointment-details">
                            <div class="provider-name">${displayItem}</div>
                            ${this.selectedCategory ? `<div class="service-name">${this.selectedCategory}</div>` : ''}
                            <div class="current-appointment">${this.formatCurrentAppointment()}</div>
                        </div>
                    </div>
                </div>
            `;
        }
        // BOOKING MODE
        else {
            let headerHtml = `
                <div class="service-provider">
                    <span class="provider-icon">${iconSvg}</span>
                    <div class="appointment-details">
            `;
            
            // Show selected category
            if (this.selectedCategory) {
                headerHtml += `<div class="service-name">${this.selectedCategory}</div>`;
            }
            
            // Show selected item
            if (this.currentItem) {
                const displayName = this.currentItem.displayName || this.currentItem.name || this.currentItem.id;
                headerHtml += `<div class="provider-name">${displayName}</div>`;
            } else if (this.specialist) {
                // Fallback to direct specialist config
                headerHtml += `<div class="provider-name">${this.specialist}</div>`;
            }
            
            headerHtml += `
                    </div>
                </div>
            `;
            
            return headerHtml;
        }
    }
    
    // Render methods
    render() {
        const container = this.createContainer();
        
        // Create category selection field if needed
        if (this.selectionMode === 'category-item') {
            this.createCategorySelectField();
            const categoryFieldElement = this.categorySelectField.render();
            container.appendChild(categoryFieldElement);
        }
        
        // Create item selection field if needed
        if (this.selectionMode === 'item' || this.selectionMode === 'category-item') {
            this.createItemSelectField();
            const itemFieldElement = this.itemSelectField.render();
            itemFieldElement.classList.add('item-select-container');
            
            // Hide initially for category-item mode
            if (this.selectionMode === 'category-item' && !this.selectedCategory) {
                itemFieldElement.style.display = 'none';
            }
            
            container.appendChild(itemFieldElement);
        }
        
        // Create the calendar component
        const calendarContainer = document.createElement('div');
        calendarContainer.className = 'calendar-container';
        calendarContainer.innerHTML = `
            <div class="calendar-header">
                <div class="calendar-title">
                    ${this.generateCalendarHeader()}
                </div>
                <div class="calendar-nav">
                    <button class="nav-btn prev-btn" type="button" aria-label="Previous month">
                        ${this.factory.SVG_ICONS.CHEVRON}
                    </button>
                    <div class="current-date"></div>
                    <button class="nav-btn next-btn" type="button" aria-label="Next month">
                        ${this.factory.SVG_ICONS.CHEVRON}
                    </button>
                </div>
            </div>
            <div class="calendar-body">
                <div class="days-container">
                    <div class="weekdays"></div>
                    <div class="days"></div>
                </div>
                <div class="times-container">
                    <div class="time-header"></div>
                    <div class="time-slots"></div>
                </div>
            </div>
        `;
        
        container.appendChild(calendarContainer);
        
        const errorElement = this.createErrorElement();
        container.appendChild(errorElement);
        
        this.element = container;
        this.calendarContainer = calendarContainer;
        this.element.fieldInstance = this;
        
        this.renderCalendarData();
        this.attachEvents();
        
        return this.element;
    }
    
    renderCalendarData() {
        if (!this.calendarContainer) return;
        
        const currentDateEl = this.calendarContainer.querySelector('.current-date');
        if (currentDateEl) {
            const dateFormatter = new Intl.DateTimeFormat(this.locale, {
                month: "long",
                year: "numeric"
            });
            currentDateEl.textContent = dateFormatter.format(this.state.currentDate);
        }
        
        const weekdaysEl = this.calendarContainer.querySelector('.weekdays');
        if (weekdaysEl) {
            weekdaysEl.innerHTML = '';
            this.texts.weekdays.forEach(day => {
                const dayEl = document.createElement("div");
                dayEl.textContent = day;
                weekdaysEl.appendChild(dayEl);
            });
        }
        
        this.renderDays();
        this.renderTimeSlots();
    }
    
    renderDays() {
        const daysEl = this.calendarContainer.querySelector('.days');
        if (!daysEl) return;
        
        daysEl.innerHTML = '';
        
        // Check if placeholder should be shown
        if (this.showPlaceholder) {
            const messageEl = document.createElement('div');
            messageEl.className = 'placeholder-days-message';
            messageEl.textContent = this.placeholderMessage || this.texts.pleaseSelectCategory;
            daysEl.appendChild(messageEl);
            return;
        }
        
        // Check selection requirements based on mode
        if (this.selectionMode === 'category-item' && !this.selectedCategory) {
            const messageEl = document.createElement('div');
            messageEl.className = 'no-category-message';
            messageEl.textContent = this.texts.pleaseSelectCategory;
            daysEl.appendChild(messageEl);
            return;
        }
        
        if ((this.selectionMode === 'item' || this.selectionMode === 'category-item') && !this.currentItem) {
            const messageEl = document.createElement('div');
            messageEl.className = 'no-item-message';
            messageEl.textContent = this.texts.pleaseSelectItem;
            daysEl.appendChild(messageEl);
            return;
        }
        
        // Render calendar days
        let daysToShow = [];
        const firstDay = new Date(this.state.currentDate.getFullYear(), this.state.currentDate.getMonth(), 1);
        const daysFromPrevMonth = firstDay.getDay();
        const lastDay = new Date(this.state.currentDate.getFullYear(), this.state.currentDate.getMonth() + 1, 0);
        const totalDays = lastDay.getDate();
        
        for (let i = daysFromPrevMonth - 1; i >= 0; i--) {
            const day = new Date(firstDay);
            day.setDate(day.getDate() - i - 1);
            daysToShow.push({ date: day, inactive: true });
        }
        
        for (let i = 1; i <= totalDays; i++) {
            const day = new Date(this.state.currentDate.getFullYear(), this.state.currentDate.getMonth(), i);
            daysToShow.push({ date: day, inactive: false });
        }
        
        const remainingDays = 42 - daysToShow.length;
        for (let i = 1; i <= remainingDays; i++) {
            const day = new Date(lastDay);
            day.setDate(day.getDate() + i);
            daysToShow.push({ date: day, inactive: true });
        }
        
        const highlightDay = this.state.selectedDate || this.getDefaultActiveDay();
        
        daysToShow.forEach(({ date, inactive }) => {
            const dayEl = document.createElement("div");
            dayEl.className = "day";
            dayEl.textContent = date.getDate();
            
            if (inactive) {
                dayEl.classList.add("inactive");
            } else {
                const dayOfWeek = date.getDay();
                if (!this.state.workingDays.includes(dayOfWeek)) {
                    dayEl.classList.add("inactive");
                } else {
                    const todayMidnight = new Date();
                    todayMidnight.setHours(0, 0, 0, 0);
                    
                    if (date < todayMidnight) {
                        dayEl.classList.add("inactive");
                    } else {
                        if (this.formatDate(date) === this.formatDate(highlightDay)) {
                            dayEl.classList.add("today");
                        }
                        
                        if (this.state.selectedDate && this.isSameDay(date, this.state.selectedDate)) {
                            dayEl.classList.add("active");
                        }
                        
                        dayEl.classList.add("available");
                        dayEl.addEventListener("click", async () => {
                            this.state.selectedDate = new Date(date);
                            this.state.selectedTime = null;
                            
                            const dateKey = this.formatDate(date);
                            const slots = await this.fetchAvailableSlots(dateKey);
                            this.state.availableSlots[dateKey] = slots;
                            
                            this.renderCalendarData();
                            this.updateValue();
                        });
                    }
                }
            }
            
            daysEl.appendChild(dayEl);
        });
    }
    
    renderTimeSlots() {
        const timeHeaderEl = this.calendarContainer.querySelector('.time-header');
        const timeSlotsEl = this.calendarContainer.querySelector('.time-slots');
        
        if (!timeHeaderEl || !timeSlotsEl) return;
        
        // Check if placeholder should be shown
        if (this.showPlaceholder) {
            timeHeaderEl.textContent = '';
            timeSlotsEl.innerHTML = `<div class="placeholder-times-message">${this.placeholderMessage || this.texts.pleaseSelectCategory}</div>`;
            return;
        }
        
        // Check selection requirements
        if (this.selectionMode === 'category-item' && !this.selectedCategory) {
            timeHeaderEl.textContent = this.texts.pleaseSelectCategory;
            timeSlotsEl.innerHTML = `<div class="no-category-message">${this.texts.pleaseSelectCategory}</div>`;
            return;
        }
        
        if ((this.selectionMode === 'item' || this.selectionMode === 'category-item') && !this.currentItem) {
            timeHeaderEl.textContent = this.texts.pleaseSelectItem;
            timeSlotsEl.innerHTML = `<div class="no-item-message">${this.texts.pleaseSelectItem}</div>`;
            return;
        }
        
        if (this.state.selectedDate) {
            const dateFormatter = new Intl.DateTimeFormat(this.locale, {
                weekday: "long",
                month: "long",
                day: "numeric"
            });
            timeHeaderEl.textContent = `${this.texts.availableTimesFor} ${dateFormatter.format(this.state.selectedDate)}`;
            
            const dateKey = this.formatDate(this.state.selectedDate);
            const timeSlots = this.state.availableSlots[dateKey] || [];
            
            if (timeSlots.length === 0) {
                timeSlotsEl.innerHTML = `<div class="no-slots-message">${this.texts.noAvailableSlots}</div>`;
            } else {
                const columnsContainer = document.createElement("div");
                columnsContainer.className = "time-slots-columns";
                
                const amColumn = document.createElement("div");
                amColumn.className = "time-slots-column";
                const pmColumn = document.createElement("div");
                pmColumn.className = "time-slots-column";
                
                const amHeader = document.createElement("div");
                amHeader.className = "time-column-header";
                amHeader.textContent = "AM";
                amColumn.appendChild(amHeader);
                
                const pmHeader = document.createElement("div");
                pmHeader.className = "time-column-header";
                pmHeader.textContent = "PM";
                pmColumn.appendChild(pmHeader);
                
                timeSlots.forEach((timeISO) => {
                    const dateTime = new Date(timeISO);
                    const hours = dateTime.getHours();
                    
                    const timeSlot = document.createElement("div");
                    timeSlot.className = "time-slot available";
                    
                    if (this.state.selectedTime === timeISO) {
                        timeSlot.classList.add("selected");
                    }
                    
                    const timeFormatter = new Intl.DateTimeFormat(this.locale, {
                        hour: "numeric",
                        minute: "2-digit",
                        hour12: true
                    });
                    timeSlot.textContent = timeFormatter.format(dateTime);
                    
                    timeSlot.addEventListener("click", () => {
                        if (!this.state.isConfirmed) {
                            this.state.selectedTime = timeISO;
                            this.renderTimeSlots();
                            this.updateValue();
                        }
                    });
                    
                    if (hours < 12) {
                        amColumn.appendChild(timeSlot);
                    } else {
                        pmColumn.appendChild(timeSlot);
                    }
                });
                
                columnsContainer.appendChild(amColumn);
                columnsContainer.appendChild(pmColumn);
                
                timeSlotsEl.innerHTML = '';
                timeSlotsEl.appendChild(columnsContainer);
            }
        } else {
            timeHeaderEl.innerHTML = `<span class="pulse-text">${this.texts.selectDate}</span>`;
            timeSlotsEl.innerHTML = `<div class="no-slots-message">${this.texts.pleaseSelectDate}</div>`;
        }
    }
    
    attachEvents() {
        if (!this.calendarContainer) return;
        
        const prevBtn = this.calendarContainer.querySelector('.prev-btn');
        const nextBtn = this.calendarContainer.querySelector('.next-btn');
        
        if (prevBtn) {
            prevBtn.addEventListener("click", () => {
                if (!this.state.isConfirmed) {
                    this.state.currentDate = new Date(
                        this.state.currentDate.getFullYear(),
                        this.state.currentDate.getMonth() - 1,
                        1
                    );
                    this.renderCalendarData();
                }
            });
        }
        
        if (nextBtn) {
            nextBtn.addEventListener("click", () => {
                if (!this.state.isConfirmed) {
                    this.state.currentDate = new Date(
                        this.state.currentDate.getFullYear(),
                        this.state.currentDate.getMonth() + 1,
                        1
                    );
                    this.renderCalendarData();
                }
            });
        }
    }
    
    // Value management
    updateValue() {
        const value = {
            selectedCategory: this.selectedCategory,
            selectedItemId: this.selectedItemId,
            selectedItem: this.currentItem,
            selectedDate: this.state.selectedDate,
            selectedTime: this.state.selectedTime,
            formattedDate: this.state.selectedDate ? this.formatDate(this.state.selectedDate) : null,
            formattedTime: this.state.selectedTime ? 
                new Intl.DateTimeFormat(this.locale, {
                    hour: "numeric",
                    minute: "2-digit",
                    hour12: true
                }).format(new Date(this.state.selectedTime)) : null
        };
        
        this.handleChange();
    }
    
    getValue() {
        return {
            selectedCategory: this.selectedCategory,
            selectedItemId: this.selectedItemId,
            selectedItem: this.currentItem,
            specialist: this.specialist,
            selectedDate: this.state.selectedDate,
            selectedTime: this.state.selectedTime,
            formattedDate: this.state.selectedDate ? this.formatDate(this.state.selectedDate) : null,
            formattedTime: this.state.selectedTime ? 
                new Intl.DateTimeFormat(this.locale, {
                    hour: "numeric",
                    minute: "2-digit",
                    hour12: true
                }).format(new Date(this.state.selectedTime)) : null,
            currentAppointment: this.currentAppointment,
            mode: this.mode
        };
    }
    
    setValue(value) {
        if (value && typeof value === 'object') {
            if (value.selectedCategory && this.selectionMode === 'category-item') {
                const categoryOption = this.availableCategories.find(s => s.name === value.selectedCategory);
                if (categoryOption) {
                    this.selectCategory(categoryOption.id);
                    if (this.categorySelectField) {
                        this.categorySelectField.setValue(categoryOption.id);
                    }
                }
            }
            
            if (value.selectedItemId && (this.selectionMode === 'item' || this.selectionMode === 'category-item')) {
                this.selectItem(value.selectedItemId, false);
                if (this.itemSelectField) {
                    this.itemSelectField.setValue(value.selectedItemId);
                }
            }
            
            if (value.selectedDate) this.state.selectedDate = new Date(value.selectedDate);
            if (value.selectedTime) this.state.selectedTime = value.selectedTime;
            if (value.currentAppointment) this.currentAppointment = value.currentAppointment;
            if (value.specialist) this.specialist = value.specialist;
            
            if (this.element) {
                this.updateCalendarHeader();
                this.renderCalendarData();
            }
        }
    }
    
    reset() {
        console.log(`📅 [${this.instanceId}] Resetting calendar field`);
        
        this.selectedCategory = '';
        this.selectedItemId = '';
        this.currentItem = null;
        this.specialist = '';
        this.filteredItems = [];
        this.resetCalendarState();
        
        if (this.categorySelectField) {
            this.categorySelectField.setValue('');
        }
        
        if (this.itemSelectField) {
            this.itemSelectField.setValue('');
            if (this.selectionMode === 'category-item') {
                const itemContainer = this.element.querySelector('.item-select-container');
                if (itemContainer) {
                    itemContainer.style.display = 'none';
                }
            }
        }
        
        this.apiKey = '';
        this.eventTypeId = null;
        this.eventTypeSlug = '';
        this.scheduleId = null;
        this.eventName = '';
        
        if (this.element) {
            this.updateCalendarHeader();
            this.renderCalendarData();
        }
    }
    
    destroy() {
        console.log(`📅 [${this.instanceId}] Destroying calendar field`);
        
        if (this.categorySelectField && typeof this.categorySelectField.destroy === 'function') {
            this.categorySelectField.destroy();
        }
        
        if (this.itemSelectField && typeof this.itemSelectField.destroy === 'function') {
            this.itemSelectField.destroy();
        }
        
        // Clear state
        this.state = null;
        this.rawCategoryItems = null;
        this.availableCategories = null;
        this.filteredItems = null;
        
        super.destroy();
    }
}
// ============================================================================
// IMAGE GALLERY FIELD - Extending BaseField (FormFields pattern)
// ============================================================================
class ImageGalleryField extends BaseField {
    constructor(factory, config) {
        super(factory, config);
        this.images = config.images || [];
        this.currentIndex = 0;
        this.autoPlay = config.autoPlay || false;
        this.autoPlayInterval = config.autoPlayInterval || 3000;
        this.showThumbnails = config.showThumbnails || false;
        this.allowFullscreen = config.allowFullscreen !== false;
        this.enableKeyboardNavigation = config.enableKeyboardNavigation !== false;
        this.language = config.language || 'en';
        this.autoPlayTimer = null;
        this.isFullscreen = false;
        this.keyboardHandler = null;
        this.galleryContainer = null;
        this.mainImage = null;
        this.imageCounter = null;
        this.prevButton = null;
        this.nextButton = null;
        this.fullscreenButton = null;
        this.thumbnailContainer = null;
    }
    render() {
        this.container = this.createContainer();
        this.container.className += ' image-gallery-field';
        this.createGalleryStructure();
        this.setupEventListeners();
        this.updateDisplay();
        if (this.autoPlay) {
            this.startAutoPlay();
        }
        return this.container;
    }
    createGalleryStructure() {
        this.galleryContainer = document.createElement('div');
        this.galleryContainer.className = 'image-gallery-container';
        this.galleryContainer.setAttribute('data-images', this.images.length);
        // Add single-image class if only one image
        if (this.images.length === 1) {
            this.galleryContainer.classList.add('single-image');
        }
        const contentWrapper = document.createElement('div');
        contentWrapper.className = 'gallery-content-wrapper';
        if (this.showThumbnails && this.images.length > 1) {
            this.createThumbnailNavigation();
            contentWrapper.appendChild(this.thumbnailContainer);
        }
        const imageContainer = document.createElement('div');
        imageContainer.className = 'gallery-image-container';
        this.mainImage = document.createElement('img');
        this.mainImage.className = 'gallery-image';
        this.mainImage.alt = 'Gallery image';
        this.mainImage.addEventListener('error', () => this.handleImageError());
        this.mainImage.addEventListener('load', () => this.handleImageLoad());
        imageContainer.appendChild(this.mainImage);
        // Navigation buttons using CalendarField structure
        if (this.images.length > 1) {
            this.prevButton = document.createElement('button');
            this.prevButton.type = 'button';
            this.prevButton.className = 'nav-btn prev-btn';
            this.prevButton.innerHTML = this.factory.SVG_ICONS.CHEVRON || '<svg viewBox="0 0 24 24" width="16" height="16"><path d="M15.41 16.59L10.83 12l4.58-4.59L14 6l-6 6 6 6 1.41-1.41z" fill="currentColor"/></svg>';
            this.prevButton.setAttribute('aria-label', this.getTranslatedText('imageGallery.previous'));
            imageContainer.appendChild(this.prevButton);
            this.nextButton = document.createElement('button');
            this.nextButton.type = 'button';
            this.nextButton.className = 'nav-btn next-btn';
            this.nextButton.innerHTML = this.factory.SVG_ICONS.CHEVRON || '<svg viewBox="0 0 24 24" width="16" height="16"><path d="M15.41 16.59L10.83 12l4.58-4.59L14 6l-6 6 6 6 1.41-1.41z" fill="currentColor"/></svg>';
            this.nextButton.setAttribute('aria-label', this.getTranslatedText('imageGallery.next'));
            imageContainer.appendChild(this.nextButton);
        }
        this.imageCounter = document.createElement('div');
        this.imageCounter.className = 'image-counter';
        imageContainer.appendChild(this.imageCounter);
        if (this.allowFullscreen) {
            this.fullscreenButton = document.createElement('button');
            this.fullscreenButton.type = 'button';
            this.fullscreenButton.className = 'fullscreen-btn';
            this.fullscreenButton.innerHTML = '⛶';
            this.fullscreenButton.setAttribute('aria-label', this.getTranslatedText('imageGallery.fullscreen'));
            imageContainer.appendChild(this.fullscreenButton);
        }
        contentWrapper.appendChild(imageContainer);
        this.galleryContainer.appendChild(contentWrapper);
        this.container.appendChild(this.galleryContainer);
    }
    createThumbnailNavigation() {
        this.thumbnailContainer = document.createElement('div');
        this.thumbnailContainer.className = 'thumbnail-container';
        this.images.forEach((imageUrl, index) => {
            const thumbnail = document.createElement('img');
            thumbnail.className = 'thumbnail';
            thumbnail.src = imageUrl;
            thumbnail.alt = `Thumbnail ${index + 1}`;
            thumbnail.addEventListener('click', (event) => {
                event.preventDefault();
                event.stopPropagation();
                this.goToImage(index);
            });
            thumbnail.addEventListener('error', () => {
                thumbnail.style.display = 'none';
            });
            this.thumbnailContainer.appendChild(thumbnail);
        });
    }
    setupEventListeners() {
        if (this.prevButton) {
            this.prevButton.addEventListener('click', (event) => {
                event.preventDefault();
                event.stopPropagation();
                this.previousImage();
            });
        }
        if (this.nextButton) {
            this.nextButton.addEventListener('click', (event) => {
                event.preventDefault();
                event.stopPropagation();
                this.nextImage();
            });
        }
        if (this.fullscreenButton) {
            this.fullscreenButton.addEventListener('click', (event) => {
                event.preventDefault();
                event.stopPropagation();
                this.toggleFullscreen();
            });
        }
        if (this.enableKeyboardNavigation) {
            this.keyboardHandler = (event) => {
                if (event.key === 'ArrowLeft') {
                    event.preventDefault();
                    this.previousImage();
                } else if (event.key === 'ArrowRight') {
                    event.preventDefault();
                    this.nextImage();
                } else if (event.key === 'Escape' && this.isFullscreen) {
                    event.preventDefault();
                    this.exitFullscreen();
                }
            };
            this.container.addEventListener('keydown', this.keyboardHandler);
        }
        // Fullscreen events need to stay on document for proper functionality
        if (typeof document !== 'undefined') {
            document.addEventListener('fullscreenchange', () => {
                this.isFullscreen = !!document.fullscreenElement;
                this.updateFullscreenButton();
            });
        }
    }
    updateDisplay() {
        if (this.images.length === 0) return;
        this.mainImage.src = this.images[this.currentIndex];
        // Direct counter format without translation
        this.imageCounter.textContent = `${this.currentIndex + 1} / ${this.images.length}`;
        if (this.thumbnailContainer) {
            const thumbnails = this.thumbnailContainer.querySelectorAll('.thumbnail');
            thumbnails.forEach((thumb, index) => {
                thumb.classList.toggle('active', index === this.currentIndex);
            });
        }
        if (this.prevButton) {
            this.prevButton.disabled = false;
        }
        if (this.nextButton) {
            this.nextButton.disabled = false;
        }
    }
    nextImage() {
        if (this.currentIndex < this.images.length - 1) {
            this.currentIndex++;
        } else {
            this.currentIndex = 0;
        }
        this.updateDisplay();
        this.resetAutoPlay();
    }
    previousImage() {
        if (this.currentIndex > 0) {
            this.currentIndex--;
        } else {
            this.currentIndex = this.images.length - 1;
        }
        this.updateDisplay();
        this.resetAutoPlay();
    }
    goToImage(index) {
        if (index >= 0 && index < this.images.length) {
            this.currentIndex = index;
            this.updateDisplay();
            this.resetAutoPlay();
        }
    }
    startAutoPlay() {
        if (this.images.length <= 1) return;
        this.autoPlayTimer = setInterval(() => {
            if (this.currentIndex === this.images.length - 1) {
                this.currentIndex = 0;
            } else {
                this.currentIndex++;
            }
            this.updateDisplay();
        }, this.autoPlayInterval);
    }
    stopAutoPlay() {
        if (this.autoPlayTimer) {
            clearInterval(this.autoPlayTimer);
            this.autoPlayTimer = null;
        }
    }
    resetAutoPlay() {
        if (this.autoPlay) {
            this.stopAutoPlay();
            this.startAutoPlay();
        }
    }
    toggleFullscreen() {
        if (this.isFullscreen) {
            this.exitFullscreen();
        } else {
            this.enterFullscreen();
        }
    }
    enterFullscreen() {
        if (this.galleryContainer.requestFullscreen) {
            this.galleryContainer.requestFullscreen();
        }
    }
    exitFullscreen() {
        if (typeof document !== 'undefined' && document.exitFullscreen) {
            document.exitFullscreen();
        }
    }
    updateFullscreenButton() {
        if (this.fullscreenButton) {
            this.fullscreenButton.innerHTML = this.isFullscreen ? '⛷' : '⛶';
            this.fullscreenButton.setAttribute('aria-label',
                this.getTranslatedText(this.isFullscreen ? 'imageGallery.exitFullscreen' : 'imageGallery.fullscreen')
            );
        }
        this.galleryContainer.classList.toggle('fullscreen', this.isFullscreen);
    }
    handleImageError() {
        console.error('🖼️ ImageGallery: Failed to load image:', this.images[this.currentIndex]);
    }
    handleImageLoad() {
        console.log('🖼️ ImageGallery: Image loaded successfully:', this.images[this.currentIndex]);
    }
    getTranslatedText(path) {
        try {
            const keys = path.split('.');
            let value = ImageExtension.FORM_DATA.translations[this.language];
            for (const key of keys) {
                value = value?.[key];
            }
            return value || path;
        } catch (error) {
            return path;
        }
    }
    getValue() {
        return {
            currentIndex: this.currentIndex,
            currentImage: this.images[this.currentIndex],
            totalImages: this.images.length,
            images: this.images
        };
    }
    setValue(value) {
        if (typeof value === 'number' && value >= 0 && value < this.images.length) {
            this.goToImage(value);
        }
    }
    cleanup() {
        super.cleanup();
        this.stopAutoPlay();
        if (this.keyboardHandler && this.container) {
            this.container.removeEventListener('keydown', this.keyboardHandler);
        }
        if (this.isFullscreen) {
            this.exitFullscreen();
        }
    }
}
// ===============================
// LEGACY COMPATIBILITY CLASSES
// ===============================
class ItemCalendarField extends CalendarField {
    constructor(factory, config) {
        // Force item selection mode and set the category
        const enhancedConfig = {
            ...config,
            selectionMode: 'item',
            selectedCategory: config.categoryName || config.eventName || ''
        };
        super(factory, enhancedConfig);
    }
}
/**
 * CategoryAndItemCalendarField - Backward compatibility  
 * Now just a wrapper around CalendarField with category-item selection mode
 */
class CategoryAndItemCalendarField extends CalendarField {
    constructor(factory, config) {
        // Force category-item selection mode
        const enhancedConfig = {
            ...config,
            selectionMode: 'category-item'
        };
        super(factory, enhancedConfig);
    }
}
class ServiceRequestCalendarField extends BaseField {
    constructor(factory, config) {
        super(factory, config);
        // Calendar configuration
        this.maxSlots = config.maxSlots || 5;
        this.workingDays = config.workingDays || [1, 2, 3, 4, 5]; // Monday to Friday
        this.timeSlots = config.timeSlots || [
            {
                id: 'morning',
                label: {
                    fr: 'Matin',
                    en: 'Morning'
                },
                hours: {
                    fr: '8h00 - 12h00',
                    en: '8:00 AM - 12:00 PM'
                }
            },
            {
                id: 'afternoon',
                label: {
                    fr: 'Après-midi',
                    en: 'Afternoon'
                },
                hours: {
                    fr: '13h00 - 17h00',
                    en: '1:00 PM - 5:00 PM'
                }
            }
        ];
        // Current language
        this.language = config.language || 'fr';
        // State
        this.state = {
            currentDate: new Date(),
            selectedDate: null,
            selectedTime: null,
            selectedSlots: [] // Array of {date, time, displayText, id}
        };
        // SVG Icons
        this.icons = {
            chevron: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 662 662" width="18px" height="18px">
                <g transform="translate(75, 75)">
                    <path fill="currentColor" d="M233.4 406.6c12.5 12.5 32.8 12.5 45.3 0l192-192c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L256 338.7 86.6 169.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3l192 192z"/>
                </g>
            </svg>`,
            sun: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="24" height="24">
                <path fill="#FF9800" d="M361.5 1.2c5 2.1 8.6 6.6 9.6 11.9L391 121l107.9 19.8c5.3 1 9.8 4.6 11.9 9.6s1.5 10.7-1.6 15.2L446.9 256l62.3 90.3c3.1 4.5 3.7 10.2 1.6 15.2s-6.6 8.6-11.9 9.6L391 391 371.1 498.9c-1 5.3-4.6 9.8-9.6 11.9s-10.7 1.5-15.2-1.6L256 446.9l-90.3 62.3c-4.5 3.1-10.2 3.7-15.2 1.6s-8.6-6.6-9.6-11.9L121 391 13.1 371.1c-5.3-1-9.8-4.6-11.9-9.6s-1.5-10.7 1.6-15.2L65.1 256 2.8 165.7c-3.1-4.5-3.7-10.2-1.6-15.2s6.6-8.6 11.9-9.6L121 121 140.9 13.1c1-5.3 4.6-9.8 9.6-11.9s10.7-1.5 15.2 1.6L256 65.1 346.3 2.8c4.5-3.1 10.2-3.7 15.2-1.6zM352 256c0 53-43 96-96 96s-96-43-96-96s43-96 96-96s96 43 96 96zm32 0c0-70.7-57.3-128-128-128s-128 57.3-128 128s57.3 128 128 128s128-57.3 128-128z"/>
            </svg>`,
            moon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512" width="24" height="24">
                <path fill="#5E35B1" d="M223.5 32C100 32 0 132.3 0 256S100 480 223.5 480c60.6 0 115.5-24.2 155.8-63.4c5-4.9 6.3-12.5 3.1-18.7s-10.1-9.7-17-8.5c-9.8 1.7-19.8 2.6-30.1 2.6c-96.9 0-175.5-78.8-175.5-176c0-65.8 36-123.1 89.3-153.3c6.1-3.5 9.2-10.5 7.7-17.3s-7.3-11.9-14.3-12.5c-6.3-.5-12.6-.8-19-.8z"/>
            </svg>`,
            delete: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"/>
                <path fill-rule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"/>
            </svg>`
        };
    }
    getText(key) {
        const translations = {
            fr: {
                selectDateAndTime: "Sélectionnez une date et une heure",
                chooseOption: "Choisissez une option :",
                selectedSlots: "Disponibilités sélectionnées",
                maxSlotsReached: "Maximum 5 disponibilités atteint",
                addThisSlot: "Ajouter cette disponibilité",
                weekdays: ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"],
                months: ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"]
            },
            en: {
                selectDateAndTime: "Select a Date and Time",
                chooseOption: "Choose an option:",
                selectedSlots: "Selected Availabilities",
                maxSlotsReached: "Maximum 5 availabilities reached",
                addThisSlot: "Add this availability",
                weekdays: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
                months: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]
            }
        };
        return translations[this.language]?.[key] || key;
    }
    validate() {
        if (this.required && this.state.selectedSlots.length === 0) {
            this.showError(this.getFieldErrorMessage('required'));
            return false;
        }
        this.hideError();
        return true;
    }
    render() {
        const container = this.createContainer();
        const calendarContainer = document.createElement('div');
        calendarContainer.className = 'service-calendar-container';
        calendarContainer.innerHTML = `
            <div class="calendar-flex-container">
                <!-- Calendar Column -->
                <div class="calendar-column">
                    <div class="calendar-header">
                        <div class="calendar-title">${this.getText('selectDateAndTime')}</div>
                        <div class="calendar-nav">
                            <button type="button" class="nav-btn prev-btn">
                                <div style="transform: rotate(90deg);">${this.icons.chevron}</div>
                            </button>
                            <div class="current-date"></div>
                            <button type="button" class="nav-btn next-btn">
                                <div style="transform: rotate(-90deg);">${this.icons.chevron}</div>
                            </button>
                        </div>
                    </div>

                    <div class="calendar-body">
                                    <div class="days-container">
                        <div class="weekdays-container"></div>
                        <div class="calendar-days"></div>
                    </div>
                <div class="time-choice-container">
                        <div class="time-choice-label">${this.getText('chooseOption')}</div>
                        <div class="time-choice-options"></div>
                        
                        <button type="button" class="add-slot-btn" disabled>
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                                <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z"></path>
                            </svg>
                            <span>${this.getText('addThisSlot')}</span>
                        </button>
                        
                        <div class="max-slots-message" style="display: none;">
                            ${this.getText('maxSlotsReached')}
                        </div>
                    </div>
            </div>
	    

		   
                </div>
                
                <!-- Availability Column -->
                <div class="availability-column">
                    
                    
                    <div class="selected-slots-container" style="display: none;">
                        <div class="selected-slots-title">
                            <span>${this.getText('selectedSlots')}</span>
                            <div class="selected-badge">0</div>
                        </div>
                        <div class="selected-slots-list"></div>
                    </div>
                </div>
            </div>
        `;
        const errorElement = this.createErrorElement();
        container.appendChild(calendarContainer);
        container.appendChild(errorElement);
        this.container = container;
        this.calendarContainer = calendarContainer;
        this.initializeCalendar();
        this.setupEventListeners();
        return container;
    }
    initializeCalendar() {
        this.updateCurrentMonthDisplay();
        this.updateWeekdays();
        this.generateCalendar();
        this.renderTimeChoices();
    }
    updateCurrentMonthDisplay() {
        const monthDisplay = this.calendarContainer.querySelector('.current-date');
        const months = this.getText('months');
        const monthName = months[this.state.currentDate.getMonth()];
        const year = this.state.currentDate.getFullYear();
        monthDisplay.textContent = `${monthName} ${year}`;
    }
    updateWeekdays() {
        const weekdaysContainer = this.calendarContainer.querySelector('.weekdays-container');
        const weekdays = this.getText('weekdays');
        weekdaysContainer.innerHTML = '';
        weekdays.forEach(day => {
            const dayDiv = document.createElement('div');
            dayDiv.textContent = day;
            weekdaysContainer.appendChild(dayDiv);
        });
    }
    generateCalendar() {
        const daysContainer = this.calendarContainer.querySelector('.calendar-days');
        daysContainer.innerHTML = '';
        const currentYear = this.state.currentDate.getFullYear();
        const currentMonth = this.state.currentDate.getMonth();
        const firstDay = new Date(currentYear, currentMonth, 1);
        const startingDayOfWeek = firstDay.getDay();
        const lastDay = new Date(currentYear, currentMonth + 1, 0);
        const totalDays = lastDay.getDate();
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        // Add empty days for start of month
        for (let i = 0; i < startingDayOfWeek; i++) {
            const emptyDay = document.createElement('div');
            emptyDay.className = 'day inactive';
            daysContainer.appendChild(emptyDay);
        }
        // Add days of the month
        for (let day = 1; day <= totalDays; day++) {
            const date = new Date(currentYear, currentMonth, day);
            const dayElement = document.createElement('div');
            dayElement.className = 'day';
            dayElement.textContent = day;
            if (!this.workingDays.includes(date.getDay())) {
                dayElement.classList.add('weekend');
            } else if (date < today) {
                dayElement.classList.add('inactive');
            } else {
                dayElement.classList.add('available');
                if (date.toDateString() === today.toDateString()) {
                    dayElement.classList.add('today');
                }
                if (this.state.selectedDate && this.isSameDay(date, this.state.selectedDate)) {
                    dayElement.classList.add('active');
                }
                dayElement.addEventListener('click', () => {
                    this.selectDate(date);
                });
            }
            daysContainer.appendChild(dayElement);
        }
    }
    renderTimeChoices() {
        const timeChoicesContainer = this.calendarContainer.querySelector('.time-choice-options');
        timeChoicesContainer.innerHTML = '';
        this.timeSlots.forEach(slot => {
            const timeChoice = document.createElement('div');
            timeChoice.className = 'time-choice';
            timeChoice.dataset.time = slot.id;
            const icon = slot.id === 'morning' ? this.icons.sun : this.icons.moon;
            const label = slot.label[this.language];
            const hours = slot.hours[this.language];
            timeChoice.innerHTML = `
                <div class="time-choice-icon">${icon}</div>
                <div class="time-choice-details">
                    <div class="time-choice-title">${label}</div>
                    <div class="time-choice-range">${hours}</div>
                </div>
            `;
            timeChoice.addEventListener('click', () => {
                this.selectTime(slot.id);
            });
            timeChoicesContainer.appendChild(timeChoice);
        });
    }
    selectDate(date) {
        // Remove active class from all days
        this.calendarContainer.querySelectorAll('.day')
            .forEach(d => d.classList.remove('active'));
        // Add active class to clicked day
        const dayElement = Array.from(this.calendarContainer.querySelectorAll('.day'))
            .find(
                el => el.textContent == date.getDate() && el.classList.contains('available')
            );
        if (dayElement) {
            dayElement.classList.add('active');
        }
        this.state.selectedDate = new Date(date);
        this.state.selectedTime = null;
        this.resetTimeChoices();
        this.updateAddSlotButton();
    }
    selectTime(timeId) {
        if (!this.state.selectedDate) return;
        this.resetTimeChoices();
        const timeChoice = this.calendarContainer.querySelector(`[data-time="${timeId}"]`);
        if (timeChoice) {
            timeChoice.classList.add('selected');
        }
        this.state.selectedTime = timeId;
        this.updateAddSlotButton();
    }
    resetTimeChoices() {
        this.calendarContainer.querySelectorAll('.time-choice')
            .forEach(choice => {
                choice.classList.remove('selected');
            });
    }
    updateAddSlotButton() {
        const addButton = this.calendarContainer.querySelector('.add-slot-btn');
        addButton.disabled = !this.state.selectedDate || !this.state.selectedTime || this.state.selectedSlots.length >= this.maxSlots;
    }
    addSelectedSlot() {
        if (!this.state.selectedDate || !this.state.selectedTime || this.state.selectedSlots.length >= this.maxSlots) {
            return;
        }
        const slotId = `${this.formatDate(this.state.selectedDate)}_${this.state.selectedTime}`;
        // Check if slot already selected
        if (this.state.selectedSlots.some(slot => slot.id === slotId)) {
            return;
        }
        const timeSlot = this.timeSlots.find(slot => slot.id === this.state.selectedTime);
        const formattedDate = this.formatDateForDisplay(this.state.selectedDate);
        const timeLabel = timeSlot.label[this.language] + ' (' + timeSlot.hours[this.language] + ')';
        const newSlot = {
            date: new Date(this.state.selectedDate),
            timeOfDay: this.state.selectedTime,
            id: slotId,
            displayText: `${formattedDate} - ${timeLabel}`
        };
        this.state.selectedSlots.push(newSlot);
        this.renderSelectedSlots();
        // Reset selections
        this.resetTimeChoices();
        this.state.selectedTime = null;
        this.updateAddSlotButton();
        this.hideError();
        this.handleChange();
        if (this.state.selectedSlots.length >= this.maxSlots) {
            this.showMaxSlotsMessage();
        }
    }
    removeSelectedSlot(slotId) {
        this.state.selectedSlots = this.state.selectedSlots.filter(slot => slot.id !== slotId);
        this.renderSelectedSlots();
        this.hideMaxSlotsMessage();
        this.handleChange();
    }
    renderSelectedSlots() {
        const slotsContainer = this.calendarContainer.querySelector('.selected-slots-container');
        const slotsList = this.calendarContainer.querySelector('.selected-slots-list');
        const slotsCount = this.calendarContainer.querySelector('.selected-badge');
        slotsCount.textContent = this.state.selectedSlots.length;
        if (this.state.selectedSlots.length > 0) {
            slotsContainer.style.display = 'block';
        } else {
            slotsContainer.style.display = 'none';
        }
        slotsList.innerHTML = '';
        this.state.selectedSlots.forEach(slot => {
            const slotItem = document.createElement('div');
            slotItem.className = 'selected-slot-item';
            slotItem.innerHTML = `
                <div class="selected-slot-info">${slot.displayText}</div>
                <button type="button" class="delete-slot" data-slot-id="${slot.id}">
                    ${this.icons.delete}
                </button>
            `;
            slotItem.querySelector('.delete-slot')
                .addEventListener('click', () => {
                    this.removeSelectedSlot(slot.id);
                });
            slotsList.appendChild(slotItem);
        });
    }
    showMaxSlotsMessage() {
        const messageElement = this.calendarContainer.querySelector('.max-slots-message');
        messageElement.style.display = 'block';
    }
    hideMaxSlotsMessage() {
        if (this.state.selectedSlots.length < this.maxSlots) {
            const messageElement = this.calendarContainer.querySelector('.max-slots-message');
            messageElement.style.display = 'none';
        }
    }
    setupEventListeners() {
        const prevBtn = this.calendarContainer.querySelector('.prev-btn');
        const nextBtn = this.calendarContainer.querySelector('.next-btn');
        const addBtn = this.calendarContainer.querySelector('.add-slot-btn');
        prevBtn.addEventListener('click', () => {
            this.state.currentDate = new Date(
                this.state.currentDate.getFullYear(),
                this.state.currentDate.getMonth() - 1,
                1
            );
            this.generateCalendar();
            this.updateCurrentMonthDisplay();
        });
        nextBtn.addEventListener('click', () => {
            this.state.currentDate = new Date(
                this.state.currentDate.getFullYear(),
                this.state.currentDate.getMonth() + 1,
                1
            );
            this.generateCalendar();
            this.updateCurrentMonthDisplay();
        });
        addBtn.addEventListener('click', () => {
            this.addSelectedSlot();
        });
    }
    formatDate(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1)
            .padStart(2, '0');
        const day = String(date.getDate())
            .padStart(2, '0');
        return `${year}-${month}-${day}`;
    }
    formatDateForDisplay(date) {
        const options = {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        };
        const locale = this.language === 'fr' ? 'fr-FR' : 'en-US';
        return new Intl.DateTimeFormat(locale, options)
            .format(date);
    }
    isSameDay(date1, date2) {
        return date1.getFullYear() === date2.getFullYear() &&
            date1.getMonth() === date2.getMonth() &&
            date1.getDate() === date2.getDate();
    }
    getValue() {
        return this.state.selectedSlots.map(slot => ({
            date: this.formatDate(slot.date),
            timeOfDay: slot.timeOfDay,
            displayText: slot.displayText
        }));
    }
    setValue(value) {
        if (Array.isArray(value)) {
            this.state.selectedSlots = value.map(slot => ({
                date: new Date(slot.date),
                timeOfDay: slot.timeOfDay,
                id: `${slot.date}_${slot.timeOfDay}`,
                displayText: slot.displayText
            }));
            this.renderSelectedSlots();
        }
    }
}
// ============================================================================
// CUSTOM CHECKBOX FIELD FOR TERMS
// ============================================================================
class TermsCheckboxField extends BaseField {
    constructor(factory, config) {
        super(factory, config);
        this.termsContent = config.termsContent || '';
        this.termsTitle = config.termsTitle || '';
        this.acceptText = config.acceptText || '';
        this.language = config.language || 'fr';
    }
    validate() {
        const checkbox = this.container.querySelector('input[type="checkbox"]');
        if (this.required && !checkbox.checked) {
            this.showError(this.getFieldErrorMessage('required'));
            return false;
        }
        this.hideError();
        return true;
    }
    render() {
        const container = this.createContainer();
        const termsContainer = document.createElement('div');
        termsContainer.className = 'terms-container';
        termsContainer.innerHTML = `
            <span class="terms-title required">${this.termsTitle}</span>
            <div class="terms-content">${this.termsContent}</div>
            <ul class="terms-list">
                <li><strong>${this.language === 'fr' ? 'Frais de déplacement' : 'Travel fees'}</strong>: ${this.language === 'fr' ? '125 $' : '$125'}</li>
                <li><strong>${this.language === 'fr' ? 'Coût horaire' : 'Hourly rate'}</strong>: ${this.language === 'fr' ? '115 $ (minimum une heure de service)' : '$115 (minimum one hour of service)'}</li>
            </ul>
            <div class="checkbox-container">
                <input type="checkbox" id="${this.id}" name="${this.name}" required />
                <label for="${this.id}" class="checkbox-label">
                    <span class="custom-checkbox">
                        <span class="check-icon">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" width="12px" height="12px">
                                <path fill="currentColor" d="M438.6 105.4c12.5 12.5 12.5 32.8 0 45.3l-256 256c-12.5 12.5-32.8 12.5-45.3 0l-128-128c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0L160 338.7 393.4 105.4c12.5-12.5 32.8-12.5 45.3 0z"/>
                            </svg>
                        </span>
                    </span>
                    <span class="checkbox-text">${this.acceptText}</span>
                </label>
            </div>
        `;
        const errorElement = this.createErrorElement();
        container.appendChild(termsContainer);
        container.appendChild(errorElement);
        this.container = container;
        // Add event listener
        const checkbox = container.querySelector('input[type="checkbox"]');
        checkbox.addEventListener('change', () => {
            if (checkbox.checked) {
                this.hideError();
            }
            this.handleChange();
        });
        return container;
    }
    getValue() {
        const checkbox = this.container.querySelector('input[type="checkbox"]');
        return checkbox ? checkbox.checked : false;
    }
    setValue(value) {
        const checkbox = this.container.querySelector('input[type="checkbox"]');
        if (checkbox) {
            checkbox.checked = !!value;
        }
    }
}
// ============================================================================
// FILE UPLOAD FIELD
// ============================================================================
class ServiceRequestFileUploadField extends BaseField {
    constructor(factory, config) {
        super(factory, config);
        this.accept = config.accept || 'image/*';
        this.language = config.language || 'fr';
    }
    validate() {
        // File upload is optional, so always return true
        return true;
    }
    render() {
        const container = this.createContainer();
        const label = this.createLabel();
        const fileUploadContainer = document.createElement('div');
        fileUploadContainer.className = 'file-upload-container';
        fileUploadContainer.innerHTML = `
            <div class="file-upload">
                <input type="file" class="file-upload-input" id="${this.id}" name="${this.name}" accept="${this.accept}">
                <div class="file-upload-text">${this.language === 'fr' ? 'Glissez et déposez une image ou cliquez pour parcourir' : 'Drag and drop an image or click to browse'}</div>
                <div class="file-upload-buttons">
                    <button type="button" class="file-upload-btn upload-btn">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
                            <path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5z"/>
                            <path d="M7.646 1.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1-.708.708L8.5 2.707V11.5a.5.5 0 0 1-1 0V2.707L5.354 4.854a.5.5 0 1 1-.708-.708l3-3z"/>
                        </svg>
                        <span>${this.language === 'fr' ? 'Choisir un fichier' : 'Choose file'}</span>
                    </button>
                    <button type="button" class="file-upload-btn camera-btn">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
                            <path d="M15 12a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h1.172a3 3 0 0 0 2.12-.879l.83-.828A1 1 0 0 1 6.827 3h2.344a1 1 0 0 1 .707.293l.828.828A3 3 0 0 0 12.828 5H14a1 1 0 0 1 1 1v6zM2 4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-1.172a2 2 0 0 1-1.414-.586l-.828-.828A2 2 0 0 0 9.172 2H6.828a2 2 0 0 0-1.414.586l-.828.828A2 2 0 0 1 3.172 4H2z"/>
                            <path d="M8 11a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5zm0 1a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM3 6.5a.5.5 0 1 1-1 0 .5.5 0 0 1 1 0z"/>
                        </svg>
                        <span>${this.language === 'fr' ? 'Prendre une photo' : 'Take a photo'}</span>
                    </button>
                </div>
                <div class="file-name-display" style="display: none;"></div>
            </div>
        `;
        container.appendChild(label);
        container.appendChild(fileUploadContainer);
        this.container = container;
        this.setupFileUploadEvents();
        return container;
    }
    setupFileUploadEvents() {
        const fileInput = this.container.querySelector('.file-upload-input');
        const fileNameDisplay = this.container.querySelector('.file-name-display');
        const uploadBtn = this.container.querySelector('.upload-btn');
        const cameraBtn = this.container.querySelector('.camera-btn');
        fileInput.addEventListener('change', () => {
            if (fileInput.files && fileInput.files[0]) {
                const fileName = fileInput.files[0].name;
                fileNameDisplay.textContent = fileName;
                fileNameDisplay.style.display = 'block';
                this.handleChange();
            }
        });
        uploadBtn.addEventListener('click', () => {
            fileInput.click();
        });
        cameraBtn.addEventListener('click', () => {
            fileInput.setAttribute('capture', 'environment');
            fileInput.click();
        });
    }
    getValue() {
        const fileInput = this.container.querySelector('.file-upload-input');
        return fileInput.files && fileInput.files[0] ? fileInput.files[0] : null;
    }
    setValue(value) {
        // File inputs cannot be programmatically set for security reasons
        // This method is mainly for form reset
        if (!value) {
            const fileInput = this.container.querySelector('.file-upload-input');
            const fileNameDisplay = this.container.querySelector('.file-name-display');
            if (fileInput) fileInput.value = '';
            if (fileNameDisplay) fileNameDisplay.style.display = 'none';
        }
    }
}
/**
 * BookingCancellationCardField - Display booking information for cancellation
 * Add this class to FormFieldFactory.js after CurrentAppointmentCardField
 */
class BookingCancellationCardField extends BaseField {
    constructor(factory, config) {
        super(factory, config);
        // Store config for later use
        this.config = config;
        // Validate required configuration
        if (!config.translations) {
            console.error('BookingCancellationCardField: translations are required in config');
        }
        if (!config.serviceMapping) {
            console.error('BookingCancellationCardField: serviceMapping is required in config');
        }
        // Current appointment specific config (same structure as CurrentAppointmentCardField)
        this.meetingName = config.meetingName || config.serviceProvider || "Provider";
        this.startTime = config.startTime || config.currentAppointment || new Date()
            .toISOString();
        this.serviceName = config.serviceName || config.eventName || this.getServiceNameFromSlug(config.eventTypeSlug, this.meetingName);
        this.language = config.language || 'en';
        this.showServiceName = config.showServiceName !== false;
        this.showDateTime = config.showDateTime !== false;
        this.showProvider = config.showProvider !== false;
        this.iconType = config.iconType || 'calendar'; // 'calendar', 'appointment', 'cancel'
        this.cardStyle = config.cardStyle || 'default'; // 'default', 'compact', 'detailed'
        // Booking cancellation specific config (additional properties)
        this.bookingId = config.bookingId || '';
        this.bookingUid = config.bookingUid || '';
        this.status = config.status || 'confirmed';
        this.attendeeEmail = config.attendeeEmail || '';
        this.attendeeName = config.attendeeName || '';
        this.showBookingInfo = config.showBookingInfo !== false;
        this.showAttendeeInfo = config.showAttendeeInfo !== false;
        // Translations and service mapping - MUST be provided from extension
        this.translations = config.translations || {};
        this.serviceMapping = config.serviceMapping || {};
    }
    // FIXED: getText method now properly accesses nested translation structure
    getText(key) {
        // First try to get from fields section
        const fieldsText = this.translations[this.language]?.fields?.[key];
        if (fieldsText) {
            return fieldsText;
        }
        // Fallback to direct access for backward compatibility
        const directText = this.translations[this.language]?.[key];
        if (directText) {
            return directText;
        }
        // Final fallback - return the key itself
        console.warn(`BookingCancellationCardField: Translation missing for key "${key}" in language "${this.language}"`);
        return key;
    }
    getServiceNameFromSlug(eventTypeSlug, fallback) {
        if (!eventTypeSlug) {
            return fallback || 'Appointment';
        }
        // Check if service mapping is provided
        const serviceName = this.serviceMapping[eventTypeSlug];
        if (serviceName) {
            return serviceName;
        }
        // Fallback: convert eventTypeSlug to readable format
        return eventTypeSlug
            .replace(/-/g, ' ')
            .replace(/\b\w/g, l => l.toUpperCase());
    }
    formatAppointmentDate(dateTimeString) {
        try {
            const date = new Date(dateTimeString);
            const formatOptions = {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric',
                hour: 'numeric',
                minute: '2-digit'
            };
            const locale = this.language === 'fr' ? 'fr-FR' : 'en-US';
            const formatter = new Intl.DateTimeFormat(locale, formatOptions);
            return formatter.format(date);
        } catch (error) {
            console.warn('Error formatting date:', error);
            return dateTimeString;
        }
    }
    getIcon() {
        const iconKey = this.iconType.toUpperCase();
        // Get icon from factory - factory is responsible for all icons
        if (this.factory.SVG_ICONS[iconKey]) {
            return this.factory.SVG_ICONS[iconKey];
        }
        // Fallback to CALENDAR if specific icon not found
        return this.factory.SVG_ICONS.CALENDAR || '';
    }
    // Booking cancellation specific methods
    getStatusDisplay() {
        const statusMap = {
            confirmed: this.getText('confirmed'),
            pending: this.getText('pending'),
            cancelled: this.getText('cancelled')
        };
        return statusMap[this.status] || this.status;
    }
    renderBookingSpecificFields() {
        let bookingFields = '';
        if (this.showBookingInfo && this.bookingId) {
            bookingFields += `<div class="meta-item"><span class="meta-label">${this.getText('bookingNumber')}:</span> <span class="meta-value">${this.bookingId}</span></div>`;
        }
        if (this.showBookingInfo) {
            bookingFields += `<div class="meta-item"><span class="meta-label">${this.getText('status')}:</span> <span class="meta-value">${this.getStatusDisplay()}</span></div>`;
        }
        if (this.showAttendeeInfo && this.attendeeName) {
            bookingFields += `<div class="meta-item"><span class="meta-label">${this.getText('attendee')}:</span> <span class="meta-value">${this.attendeeName}</span></div>`;
        }
        if (this.showAttendeeInfo && this.attendeeEmail) {
            bookingFields += `<div class="meta-item"><span class="meta-label">${this.getText('email')}:</span> <span class="meta-value">${this.attendeeEmail}</span></div>`;
        }
        return bookingFields;
    }
    validate() {
        // Booking cancellation card is typically read-only, so it's always valid
        // But we can validate that required booking data is present
        if (this.required) {
            const hasRequiredData = this.meetingName && this.startTime;
            if (!hasRequiredData) {
                this.showError("Booking information is required");
                return false;
            }
        }
        this.hideError();
        return true;
    }
    render() {
        this.element = document.createElement('div');
        this.element.className = `form-field current-appointment-card-field card-style-${this.cardStyle}`;
        this.element.id = this.id;
        const appointmentDate = this.formatAppointmentDate(this.startTime);
        let cardContent = '';
        if (this.cardStyle === 'compact') {
            cardContent = this.renderCompactCard(appointmentDate);
        } else if (this.cardStyle === 'detailed') {
            cardContent = this.renderDetailedCard(appointmentDate);
        } else {
            cardContent = this.renderDefaultCard(appointmentDate);
        }
        this.element.innerHTML = cardContent;
        // Add error container if required
        if (this.required) {
            const errorContainer = document.createElement('div');
            errorContainer.className = 'error-container';
            errorContainer.innerHTML = `
                <div class="error-message" id="${this.id}-error">
                    <div class="error-icon">!</div>
                    <span class="error-text">Booking information is required</span>
                </div>
            `;
            this.element.appendChild(errorContainer);
        }
        return this.element;
    }
    renderDefaultCard(appointmentDate) {
        return `
            <div class="current-appointment-card">
                <div class="appointment-header">
                    <div class="appointment-icon">
                        ${this.getIcon()}
                    </div>
                    <div class="appointment-info">
                        <div class="appointment-info-title">${this.getText('bookingToCancel')}</div>
                        ${this.showProvider ? `<p><strong>${this.getText('scheduledWith')}:</strong> ${this.meetingName}</p>` : ''}
                        ${this.showServiceName && this.serviceName ? `<p><strong>${this.getText('serviceName')}:</strong> ${this.serviceName}</p>` : ''}
                        ${this.showDateTime ? `<p><strong>${this.getText('currentDateTime')}:</strong> ${appointmentDate}</p>` : ''}
                    </div>
                </div>
            </div>
        `;
    }
    renderCompactCard(appointmentDate) {
        return `
            <div class="current-appointment-card compact">
                <div class="appointment-header-compact">
                    <div class="appointment-icon-small">
                        ${this.getIcon()}
                    </div>
                    <div class="appointment-summary">
                        <div class="appointment-title-compact">${this.meetingName}</div>
                        <div class="appointment-date-compact">${appointmentDate}</div>
                    </div>
                </div>
            </div>
        `;
    }
    renderDetailedCard(appointmentDate) {
        const bookingFields = this.renderBookingSpecificFields();
        return `
            <div class="current-appointment-card detailed">
                <div class="appointment-header-detailed">
                    <div class="appointment-icon-large">
                        ${this.getIcon()}
                    </div>
                    <div class="appointment-details-full">
                        <div class="appointment-title-large">${this.getText('bookingToCancel')}</div>
                        <div class="appointment-meta">
                            ${this.showProvider ? `<div class="meta-item"><span class="meta-label">${this.getText('scheduledWith')}:</span> <span class="meta-value">${this.meetingName}</span></div>` : ''}
                            ${this.showServiceName && this.serviceName ? `<div class="meta-item"><span class="meta-label">${this.getText('serviceName')}:</span> <span class="meta-value">${this.serviceName}</span></div>` : ''}
                            ${this.showDateTime ? `<div class="meta-item"><span class="meta-label">${this.getText('currentDateTime')}:</span> <span class="meta-value">${appointmentDate}</span></div>` : ''}
                            ${bookingFields}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    getValue() {
        // Return the booking information as an object
        return {
            meetingName: this.meetingName,
            startTime: this.startTime,
            serviceName: this.serviceName,
            formattedDate: this.formatAppointmentDate(this.startTime),
            language: this.language,
            // Booking cancellation specific properties
            bookingId: this.bookingId,
            bookingUid: this.bookingUid,
            status: this.status,
            attendeeEmail: this.attendeeEmail,
            attendeeName: this.attendeeName
        };
    }
    setValue(value) {
        // Update booking information if provided
        if (value && typeof value === 'object') {
            if (value.meetingName) this.meetingName = value.meetingName;
            if (value.startTime) this.startTime = value.startTime;
            if (value.serviceName) this.serviceName = value.serviceName;
            if (value.language) this.language = value.language;
            // Booking cancellation specific properties
            if (value.bookingId) this.bookingId = value.bookingId;
            if (value.bookingUid) this.bookingUid = value.bookingUid;
            if (value.status) this.status = value.status;
            if (value.attendeeEmail) this.attendeeEmail = value.attendeeEmail;
            if (value.attendeeName) this.attendeeName = value.attendeeName;
            // Re-render the card with new values
            if (this.element) {
                const appointmentDate = this.formatAppointmentDate(this.startTime);
                let cardContent = '';
                if (this.cardStyle === 'compact') {
                    cardContent = this.renderCompactCard(appointmentDate);
                } else if (this.cardStyle === 'detailed') {
                    cardContent = this.renderDetailedCard(appointmentDate);
                } else {
                    cardContent = this.renderDefaultCard(appointmentDate);
                }
                const cardContainer = this.element.querySelector('.current-appointment-card');
                if (cardContainer) {
                    cardContainer.outerHTML = cardContent;
                }
            }
        }
    }
    showError(message) {
        const errorElement = this.element.querySelector(`#${this.id}-error`);
        if (errorElement) {
            const errorText = errorElement.querySelector('.error-text');
            if (errorText) {
                errorText.textContent = message;
            }
            errorElement.classList.add('show');
        }
    }
    hideError() {
        const errorElement = this.element.querySelector(`#${this.id}-error`);
        if (errorElement) {
            errorElement.classList.remove('show');
        }
    }
    destroy() {
        // Clean up any event listeners or resources
        if (this.element) {
            this.element.remove();
        }
    }
    // Update configuration method for dynamic updates
    updateConfig(newConfig) {
        if (newConfig.meetingName) this.meetingName = newConfig.meetingName;
        if (newConfig.startTime) this.startTime = newConfig.startTime;
        if (newConfig.serviceName) this.serviceName = newConfig.serviceName;
        if (newConfig.language) this.language = newConfig.language;
        if (newConfig.translations) this.translations = {
            ...this.translations,
            ...newConfig.translations
        };
        if (newConfig.serviceMapping) this.serviceMapping = {
            ...this.serviceMapping,
            ...newConfig.serviceMapping
        };
        // Booking cancellation specific properties
        if (newConfig.bookingId) this.bookingId = newConfig.bookingId;
        if (newConfig.bookingUid) this.bookingUid = newConfig.bookingUid;
        if (newConfig.status) this.status = newConfig.status;
        if (newConfig.attendeeEmail) this.attendeeEmail = newConfig.attendeeEmail;
        if (newConfig.attendeeName) this.attendeeName = newConfig.attendeeName;
        // Update service name if eventTypeSlug changed
        if (newConfig.eventTypeSlug) {
            this.serviceName = this.getServiceNameFromSlug(newConfig.eventTypeSlug, this.meetingName);
        }
        // Re-render if element exists
        if (this.element) {
            const appointmentDate = this.formatAppointmentDate(this.startTime);
            let cardContent = '';
            if (this.cardStyle === 'compact') {
                cardContent = this.renderCompactCard(appointmentDate);
            } else if (this.cardStyle === 'detailed') {
                cardContent = this.renderDetailedCard(appointmentDate);
            } else {
                cardContent = this.renderDefaultCard(appointmentDate);
            }
            const cardContainer = this.element.querySelector('.current-appointment-card');
            if (cardContainer) {
                cardContainer.outerHTML = cardContent;
            }
        }
    }
}
/**
 * TabManager - A field that manages multiple tabs with their own content
 * Extends BaseField to integrate seamlessly with FormFieldFactory
 */
class TabManager extends BaseField {
    constructor(factory, config) {
        super(factory, config);
        // Tab-specific configuration
        this.tabs = config.tabs || []; // Array of tab objects
        this.activeTabId = config.activeTabId || (this.tabs[0]?.id);
        this.tabStyle = config.tabStyle || 'default'; // 'default', 'pills', 'underline'
        this.orientation = config.orientation || 'horizontal'; // 'horizontal', 'vertical'
        // Tab structure example:
        // {
        //   id: 'borrowing',
        //   label: 'Borrowing Capacity',
        //   fields: [field configurations],
        //   onActivate: function(tabId, tabManager) {},
        //   onDeactivate: function(tabId, tabManager) {},
        //   customContent: null // Optional custom HTML content
        // }
        this.tabFieldInstances = new Map(); // Store field instances for each tab
        this.tabContainers = new Map(); // Store tab content containers
        this.onTabChange = config.onTabChange || null;
        this.allowValidation = config.allowValidation !== false;
        // Event listeners registry
        this.tabEventListeners = [];
    }
    validate() {
        if (!this.allowValidation) return true;
        // Validate all fields in all tabs or just active tab based on config
        const validateAllTabs = this.config.validateAllTabs || false;
        if (validateAllTabs) {
            // Validate all tabs
            let isValid = true;
            this.tabFieldInstances.forEach((fields, tabId) => {
                fields.forEach(field => {
                    if (!field.validate()) {
                        isValid = false;
                    }
                });
            });
            return isValid;
        } else {
            // Validate only active tab
            const activeFields = this.tabFieldInstances.get(this.activeTabId) || [];
            return activeFields.every(field => field.validate());
        }
    }
    render() {
        const container = this.createContainer();
        // Create tab navigation
        const tabNav = this.createTabNavigation();
        container.appendChild(tabNav);
        // Create tab content area
        const tabContent = document.createElement('div');
        tabContent.className = 'tab-content-area';
        // Create content for each tab
        this.tabs.forEach(tab => {
            const tabContainer = this.createTabContent(tab);
            this.tabContainers.set(tab.id, tabContainer);
            tabContent.appendChild(tabContainer);
        });
        container.appendChild(tabContent);
        // Create error element
        const errorElement = this.createErrorElement();
        container.appendChild(errorElement);
        // Set initial active tab
        this.setActiveTab(this.activeTabId, false);
        this.container = container;
        return container;
    }
    createTabNavigation() {
        const navContainer = document.createElement('div');
        navContainer.className = `tab-navigation ${this.tabStyle} ${this.orientation}`;
        // Add centering styles
        navContainer.style.display = 'flex';
        navContainer.style.justifyContent = 'center';
        navContainer.style.alignItems = 'center';
        navContainer.style.marginBottom = '20px';
        // Create inner container for the buttons
        const buttonContainer = document.createElement('div');
        buttonContainer.className = 'tab-buttons-container';
        buttonContainer.style.display = 'flex';
        buttonContainer.style.gap = '10px';
        buttonContainer.style.flexWrap = 'wrap';
        buttonContainer.style.justifyContent = 'center';
        this.tabs.forEach(tab => {
            const tabButton = document.createElement('button');
            tabButton.type = 'button';
            tabButton.className = 'tab-button';
            tabButton.dataset.tabId = tab.id;
            tabButton.textContent = tab.label;
            // Override flex: 1 to allow natural button width
            tabButton.style.flex = 'none';
            // Add active class if this is the active tab
            if (tab.id === this.activeTabId) {
                tabButton.classList.add('active');
            }
            // Add click event listener
            const clickHandler = (e) => {
                e.preventDefault();
                this.setActiveTab(tab.id);
            };
            tabButton.addEventListener('click', clickHandler);
            this.tabEventListeners.push({
                element: tabButton,
                event: 'click',
                handler: clickHandler
            });
            buttonContainer.appendChild(tabButton);
        });
        navContainer.appendChild(buttonContainer);
        return navContainer;
    }
    createTabContent(tab) {
        const tabContainer = document.createElement('div');
        tabContainer.className = 'tab-content';
        tabContainer.dataset.tabId = tab.id;
        tabContainer.style.display = tab.id === this.activeTabId ? 'block' : 'none';
        if (tab.customContent && typeof tab.customContent === 'function') {
            // Use custom content function
            tab.customContent(tabContainer, this);
        } else if (tab.customContent) {
            // Use custom HTML content
            tabContainer.innerHTML = tab.customContent;
        } else if (tab.fields && Array.isArray(tab.fields)) {
            // Create fields from configuration
            this.createTabFields(tab, tabContainer);
        }
        return tabContainer;
    }
    createTabFields(tab, container) {
        const fieldInstances = [];
        // Group fields by rows if specified
        const fieldGroups = this.groupFieldsByRow(tab.fields);
        fieldGroups.forEach(group => {
            if (group.isRow) {
                // Create row container
                const rowContainer = document.createElement('div');
                rowContainer.className = 'field-row';
                group.fields.forEach(fieldConfig => {
                    const colContainer = document.createElement('div');
                    colContainer.className = 'field-col';
                    const field = this.createFieldInstance(fieldConfig, tab.id);
                    if (field) {
                        fieldInstances.push(field);
                        colContainer.appendChild(field.render());
                    }
                    rowContainer.appendChild(colContainer);
                });
                container.appendChild(rowContainer);
            } else {
                // Single field
                const field = this.createFieldInstance(group.fields[0], tab.id);
                if (field) {
                    fieldInstances.push(field);
                    container.appendChild(field.render());
                }
            }
        });
        // Store field instances for this tab
        this.tabFieldInstances.set(tab.id, fieldInstances);
    }
    groupFieldsByRow(fields) {
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
    createFieldInstance(fieldConfig, tabId) {
        // Create unique field ID with tab prefix
        const enhancedConfig = {
            ...fieldConfig,
            id: `${tabId}-${fieldConfig.id}`,
            onChange: (value) => {
                // Call original onChange if provided
                if (fieldConfig.onChange) {
                    fieldConfig.onChange(value, tabId, this);
                }
                // Call tab manager onChange
                this.handleFieldChange(tabId, fieldConfig.name || fieldConfig.id, value);
            }
        };
        return this.factory.createField(enhancedConfig);
    }
    handleFieldChange(tabId, fieldName, value) {
        // Update the tab's value
        if (!this.value) this.value = {};
        if (!this.value[tabId]) this.value[tabId] = {};
        this.value[tabId][fieldName] = value;
        // Call main field change handler
        this.handleChange();
        // Call tab-specific change handler if provided
        const tab = this.tabs.find(t => t.id === tabId);
        if (tab && tab.onFieldChange) {
            tab.onFieldChange(fieldName, value, tabId, this);
        }
    }
    setActiveTab(tabId, triggerCallbacks = true) {
        const previousTabId = this.activeTabId;
        if (previousTabId === tabId) return; // No change needed
        // Call deactivate callback for previous tab
        if (triggerCallbacks && previousTabId) {
            const previousTab = this.tabs.find(t => t.id === previousTabId);
            if (previousTab && previousTab.onDeactivate) {
                previousTab.onDeactivate(previousTabId, this);
            }
        }
        // Update active tab
        this.activeTabId = tabId;
        // Update tab buttons
        this.container.querySelectorAll('.tab-button')
            .forEach(btn => {
                btn.classList.toggle('active', btn.dataset.tabId === tabId);
            });
        // Show/hide tab content
        this.tabContainers.forEach((container, currentTabId) => {
            container.style.display = currentTabId === tabId ? 'block' : 'none';
        });
        // Call activate callback for new tab
        if (triggerCallbacks) {
            const activeTab = this.tabs.find(t => t.id === tabId);
            if (activeTab && activeTab.onActivate) {
                activeTab.onActivate(tabId, this);
            }
            // Call global tab change callback
            if (this.onTabChange) {
                this.onTabChange(tabId, previousTabId, this);
            }
        }
        // Trigger change event
        this.handleChange();
    }
    getValue() {
        // Return object with all tab values and current active tab
        const allValues = {};
        this.tabFieldInstances.forEach((fields, tabId) => {
            allValues[tabId] = {};
            fields.forEach(field => {
                const fieldName = field.name;
                allValues[tabId][fieldName] = field.getValue();
            });
        });
        return {
            activeTab: this.activeTabId,
            tabs: allValues,
            // Convenience accessors
            ...allValues
        };
    }
    setValue(value) {
        if (!value || typeof value !== 'object') return;
        // Set active tab if provided
        if (value.activeTab) {
            this.setActiveTab(value.activeTab, false);
        }
        // Set values for each tab
        const tabValues = value.tabs || value;
        this.tabFieldInstances.forEach((fields, tabId) => {
            const tabData = tabValues[tabId];
            if (tabData && typeof tabData === 'object') {
                fields.forEach(field => {
                    const fieldName = field.name;
                    if (tabData[fieldName] !== undefined) {
                        field.setValue(tabData[fieldName]);
                    }
                });
            }
        });
        this.value = value;
    }
    // Get values for specific tab
    getTabValues(tabId) {
        const fields = this.tabFieldInstances.get(tabId);
        if (!fields) return {};
        const values = {};
        fields.forEach(field => {
            values[field.name] = field.getValue();
        });
        return values;
    }
    // Set values for specific tab
    setTabValues(tabId, values) {
        const fields = this.tabFieldInstances.get(tabId);
        if (!fields || !values) return;
        fields.forEach(field => {
            if (values[field.name] !== undefined) {
                field.setValue(values[field.name]);
            }
        });
    }
    // Get field instance by tab and field name
    getField(tabId, fieldName) {
        const fields = this.tabFieldInstances.get(tabId);
        if (!fields) return null;
        return fields.find(field => field.name === fieldName);
    }
    // Add new tab dynamically
    addTab(tabConfig) {
        this.tabs.push(tabConfig);
        if (this.container) {
            // Re-render if already rendered
            const buttonContainer = this.container.querySelector('.tab-buttons-container');
            const tabContent = this.container.querySelector('.tab-content-area');
            // Add new tab button
            const tabButton = document.createElement('button');
            tabButton.type = 'button';
            tabButton.className = 'tab-button';
            tabButton.dataset.tabId = tabConfig.id;
            tabButton.textContent = tabConfig.label;
            // Override flex: 1 to allow natural button width
            tabButton.style.flex = 'none';
            const clickHandler = (e) => {
                e.preventDefault();
                this.setActiveTab(tabConfig.id);
            };
            tabButton.addEventListener('click', clickHandler);
            this.tabEventListeners.push({
                element: tabButton,
                event: 'click',
                handler: clickHandler
            });
            buttonContainer.appendChild(tabButton);
            // Add new tab content
            const tabContainer = this.createTabContent(tabConfig);
            this.tabContainers.set(tabConfig.id, tabContainer);
            tabContent.appendChild(tabContainer);
        }
    }
    // Remove tab
    removeTab(tabId) {
        this.tabs = this.tabs.filter(tab => tab.id !== tabId);
        if (this.container) {
            // Remove tab button
            const tabButton = this.container.querySelector(`.tab-button[data-tab-id="${tabId}"]`);
            if (tabButton) {
                // Remove event listeners
                this.tabEventListeners = this.tabEventListeners.filter(listener => {
                    if (listener.element === tabButton) {
                        tabButton.removeEventListener(listener.event, listener.handler);
                        return false;
                    }
                    return true;
                });
                tabButton.remove();
            }
            // Remove tab content
            const tabContainer = this.tabContainers.get(tabId);
            if (tabContainer) {
                tabContainer.remove();
                this.tabContainers.delete(tabId);
            }
            // Remove field instances
            this.tabFieldInstances.delete(tabId);
            // Switch to first tab if removing active tab
            if (this.activeTabId === tabId && this.tabs.length > 0) {
                this.setActiveTab(this.tabs[0].id);
            }
        }
    }
    // Clean up event listeners
    cleanup() {
        this.tabEventListeners.forEach(({
            element,
            event,
            handler
        }) => {
            element.removeEventListener(event, handler);
        });
        this.tabEventListeners = [];
        // Cleanup field instances
        this.tabFieldInstances.forEach(fields => {
            fields.forEach(field => {
                if (field.cleanup) field.cleanup();
            });
        });
        super.cleanup();
    }
    destroy() {
        this.cleanup();
        this.tabFieldInstances.clear();
        this.tabContainers.clear();
    }
}
class CurrentAppointmentCardField extends BaseField {
    constructor(factory, config) {
        super(factory, config);
        // Store config for later use
        this.config = config;
        // Validate required configuration
        if (!config.translations) {
            console.error('CurrentAppointmentCardField: translations are required in config');
        }
        if (!config.serviceMapping) {
            console.error('CurrentAppointmentCardField: serviceMapping is required in config');
        }
        // Current appointment specific config
        this.meetingName = config.meetingName || config.serviceProvider || "Provider";
        this.startTime = config.startTime || config.currentAppointment || new Date()
            .toISOString();
        this.serviceName = config.serviceName || config.eventName || this.getServiceNameFromSlug(config.eventTypeSlug, this.meetingName);
        this.language = config.language || 'en';
        this.showServiceName = config.showServiceName !== false;
        this.showDateTime = config.showDateTime !== false;
        this.showProvider = config.showProvider !== false;
        this.iconType = config.iconType || 'calendar'; // 'calendar', 'appointment', 'reschedule'
        this.cardStyle = config.cardStyle || 'default'; // 'default', 'compact', 'detailed'
        // Translations and service mapping - MUST be provided from extension
        this.translations = config.translations || {};
        this.serviceMapping = config.serviceMapping || {};
    }
    // FIXED: getText method now properly accesses nested translation structure
    getText(key) {
        // First try to get from fields section
        const fieldsText = this.translations[this.language]?.fields?.[key];
        if (fieldsText) {
            return fieldsText;
        }
        // Fallback to direct access for backward compatibility
        const directText = this.translations[this.language]?.[key];
        if (directText) {
            return directText;
        }
        // Final fallback - return the key itself
        console.warn(`CurrentAppointmentCardField: Translation missing for key "${key}" in language "${this.language}"`);
        return key;
    }
    getServiceNameFromSlug(eventTypeSlug, fallback) {
        if (!eventTypeSlug) {
            return fallback || 'Appointment';
        }
        // Check if service mapping is provided
        const serviceName = this.serviceMapping[eventTypeSlug];
        if (serviceName) {
            return serviceName;
        }
        // Fallback: convert eventTypeSlug to readable format
        return eventTypeSlug
            .replace(/-/g, ' ')
            .replace(/\b\w/g, l => l.toUpperCase());
    }
    formatAppointmentDate(dateTimeString) {
        try {
            const date = new Date(dateTimeString);
            const formatOptions = {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric',
                hour: 'numeric',
                minute: '2-digit'
            };
            const locale = this.language === 'fr' ? 'fr-FR' : 'en-US';
            const formatter = new Intl.DateTimeFormat(locale, formatOptions);
            return formatter.format(date);
        } catch (error) {
            console.warn('Error formatting date:', error);
            return dateTimeString;
        }
    }
    getIcon() {
        const iconKey = this.iconType.toUpperCase();
        // Get icon from factory - factory is responsible for all icons
        if (this.factory.SVG_ICONS[iconKey]) {
            return this.factory.SVG_ICONS[iconKey];
        }
        // Fallback to CALENDAR if specific icon not found
        return this.factory.SVG_ICONS.CALENDAR || '';
    }
    validate() {
        // Current appointment card is typically read-only, so it's always valid
        // But we can validate that required appointment data is present
        if (this.required) {
            const hasRequiredData = this.meetingName && this.startTime;
            if (!hasRequiredData) {
                this.showError("Appointment information is required");
                return false;
            }
        }
        this.hideError();
        return true;
    }
    render() {
        this.element = document.createElement('div');
        this.element.className = `form-field current-appointment-card-field card-style-${this.cardStyle}`;
        this.element.id = this.id;
        const appointmentDate = this.formatAppointmentDate(this.startTime);
        let cardContent = '';
        if (this.cardStyle === 'compact') {
            cardContent = this.renderCompactCard(appointmentDate);
        } else if (this.cardStyle === 'detailed') {
            cardContent = this.renderDetailedCard(appointmentDate);
        } else {
            cardContent = this.renderDefaultCard(appointmentDate);
        }
        this.element.innerHTML = cardContent;
        // Add error container if required
        if (this.required) {
            const errorContainer = document.createElement('div');
            errorContainer.className = 'error-container';
            errorContainer.innerHTML = `
                <div class="error-message" id="${this.id}-error">
                    <div class="error-icon">!</div>
                    <span class="error-text">Appointment information is required</span>
                </div>
            `;
            this.element.appendChild(errorContainer);
        }
        return this.element;
    }
    renderDefaultCard(appointmentDate) {
        return `
            <div class="current-appointment-card">
                <div class="appointment-header">
                    <div class="appointment-icon">
                        ${this.getIcon()}
                    </div>
                    <div class="appointment-info">
                        <div class="appointment-info-title">${this.getText('currentAppointment')}</div>
                        ${this.showProvider ? `<p><strong>${this.getText('scheduledWith')}:</strong> ${this.meetingName}</p>` : ''}
                        ${this.showServiceName && this.serviceName ? `<p><strong>${this.getText('serviceName')}:</strong> ${this.serviceName}</p>` : ''}
                        ${this.showDateTime ? `<p><strong>${this.getText('currentDateTime')}:</strong> ${appointmentDate}</p>` : ''}
                    </div>
                </div>
            </div>
        `;
    }
    renderCompactCard(appointmentDate) {
        return `
            <div class="current-appointment-card compact">
                <div class="appointment-header-compact">
                    <div class="appointment-icon-small">
                        ${this.getIcon()}
                    </div>
                    <div class="appointment-summary">
                        <div class="appointment-title-compact">${this.meetingName}</div>
                        <div class="appointment-date-compact">${appointmentDate}</div>
                    </div>
                </div>
            </div>
        `;
    }
    renderDetailedCard(appointmentDate) {
        return `
            <div class="current-appointment-card detailed">
                <div class="appointment-header-detailed">
                    <div class="appointment-icon-large">
                        ${this.getIcon()}
                    </div>
                    <div class="appointment-details-full">
                        <div class="appointment-title-large">${this.getText('currentAppointment')}</div>
                        <div class="appointment-meta">
                            ${this.showProvider ? `<div class="meta-item"><span class="meta-label">${this.getText('scheduledWith')}:</span> <span class="meta-value">${this.meetingName}</span></div>` : ''}
                            ${this.showServiceName && this.serviceName ? `<div class="meta-item"><span class="meta-label">${this.getText('serviceName')}:</span> <span class="meta-value">${this.serviceName}</span></div>` : ''}
                            ${this.showDateTime ? `<div class="meta-item"><span class="meta-label">${this.getText('currentDateTime')}:</span> <span class="meta-value">${appointmentDate}</span></div>` : ''}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    getValue() {
        // Return the appointment information as an object
        return {
            meetingName: this.meetingName,
            startTime: this.startTime,
            serviceName: this.serviceName,
            formattedDate: this.formatAppointmentDate(this.startTime),
            language: this.language
        };
    }
    setValue(value) {
        // Update appointment information if provided
        if (value && typeof value === 'object') {
            if (value.meetingName) this.meetingName = value.meetingName;
            if (value.startTime) this.startTime = value.startTime;
            if (value.serviceName) this.serviceName = value.serviceName;
            if (value.language) this.language = value.language;
            // Re-render the card with new values
            if (this.element) {
                const appointmentDate = this.formatAppointmentDate(this.startTime);
                let cardContent = '';
                if (this.cardStyle === 'compact') {
                    cardContent = this.renderCompactCard(appointmentDate);
                } else if (this.cardStyle === 'detailed') {
                    cardContent = this.renderDetailedCard(appointmentDate);
                } else {
                    cardContent = this.renderDefaultCard(appointmentDate);
                }
                const cardContainer = this.element.querySelector('.current-appointment-card');
                if (cardContainer) {
                    cardContainer.outerHTML = cardContent;
                }
            }
        }
    }
    showError(message) {
        const errorElement = this.element.querySelector(`#${this.id}-error`);
        if (errorElement) {
            const errorText = errorElement.querySelector('.error-text');
            if (errorText) {
                errorText.textContent = message;
            }
            errorElement.classList.add('show');
        }
    }
    hideError() {
        const errorElement = this.element.querySelector(`#${this.id}-error`);
        if (errorElement) {
            errorElement.classList.remove('show');
        }
    }
    destroy() {
        // Clean up any event listeners or resources
        if (this.element) {
            this.element.remove();
        }
    }
    // Update configuration method for dynamic updates
    updateConfig(newConfig) {
        if (newConfig.meetingName) this.meetingName = newConfig.meetingName;
        if (newConfig.startTime) this.startTime = newConfig.startTime;
        if (newConfig.serviceName) this.serviceName = newConfig.serviceName;
        if (newConfig.language) this.language = newConfig.language;
        if (newConfig.translations) this.translations = {
            ...this.translations,
            ...newConfig.translations
        };
        if (newConfig.serviceMapping) this.serviceMapping = {
            ...this.serviceMapping,
            ...newConfig.serviceMapping
        };
        // Update service name if eventTypeSlug changed
        if (newConfig.eventTypeSlug) {
            this.serviceName = this.getServiceNameFromSlug(newConfig.eventTypeSlug, this.meetingName);
        }
        // Re-render if element exists
        if (this.element) {
            const appointmentDate = this.formatAppointmentDate(this.startTime);
            let cardContent = '';
            if (this.cardStyle === 'compact') {
                cardContent = this.renderCompactCard(appointmentDate);
            } else if (this.cardStyle === 'detailed') {
                cardContent = this.renderDetailedCard(appointmentDate);
            } else {
                cardContent = this.renderDefaultCard(appointmentDate);
            }
            const cardContainer = this.element.querySelector('.current-appointment-card');
            if (cardContainer) {
                cardContainer.outerHTML = cardContent;
            }
        }
    }
}
// ============================================================================
// COMPLETE FIXED CAL.COM BASE UTILITY WITH CORRECTED BOOKING HANDLER
// ============================================================================
class CalComBaseUtility {
    constructor(config = {}) {
        this.apiKey = config.apiKey || "";
        this.apiVersion = config.apiVersion || "2024-08-13";
        this.baseUrl = config.baseUrl || "https://api.cal.com/v2";
        this.logPrefix = config.logPrefix || "🗓️ CalCom";
        this.enableLogging = config.enableLogging !== false;
        // Default error messages
        this.errorMessages = {
            missingApiKey: "API key is required",
            missingBookingId: "Booking ID/UID is required",
            bookingNotFound: "Booking not found",
            invalidResponse: "Invalid API response",
            networkError: "Network error occurred",
            missingReason: "Reason is required",
            missingNewTime: "New appointment time is required",
            missingRescheduledBy: "rescheduledBy email is required",
            missingBookingData: "Booking data is required",
            missingEventTypeId: "Event type ID is required",
            bookingFailed: "Failed to create booking",
            ...config.errorMessages
        };
    }
    // ============================================================================
    // CORE API METHODS
    // ============================================================================
    async makeApiRequest(endpoint, options = {}) {
        const url = `${this.baseUrl}${endpoint}`;
        const defaultOptions = {
            headers: {
                "Authorization": `Bearer ${this.apiKey}`,
                "cal-api-version": this.apiVersion,
                "Content-Type": "application/json"
            }
        };
        const requestOptions = {
            ...defaultOptions,
            ...options,
            headers: {
                ...defaultOptions.headers,
                ...options.headers
            }
        };
        this.log('🔍 API Request:', {
            url,
            method: requestOptions.method || 'GET',
            bodyParsed: options.body ? JSON.parse(options.body) : null
        });
        try {
            const response = await fetch(url, requestOptions);
            if (!response.ok) {
                let errorDetails = null;
                try {
                    errorDetails = await response.text();
                } catch (e) {
                    // Ignore error reading response
                }
                throw new Error(`HTTP error! status: ${response.status}${errorDetails ? ` - ${errorDetails}` : ''}`);
            }
            const responseData = await response.json();
            this.log('✅ API Response:', responseData);
            return responseData;
        } catch (error) {
            this.logError('❌ API Request failed:', error);
            throw error;
        }
    }
    async fetchBooking(uid) {
        if (!uid) throw new Error(this.errorMessages.missingBookingId);
        if (!this.apiKey) throw new Error(this.errorMessages.missingApiKey);
        try {
            const response = await this.makeApiRequest(`/bookings/${uid}`, {
                method: 'GET'
            });
            return response.data || null;
        } catch (error) {
            this.logError('Error fetching booking:', error);
            return null;
        }
    }
    async cancelBooking(uid, reason = "") {
        if (!uid) throw new Error(this.errorMessages.missingBookingId);
        if (!this.apiKey) throw new Error(this.errorMessages.missingApiKey);
        const body = reason ? {
            cancellationReason: reason
        } : {};
        try {
            const response = await this.makeApiRequest(`/bookings/${uid}/cancel`, {
                method: 'POST',
                body: JSON.stringify(body)
            });
            if (response.status && response.status !== "success") {
                throw new Error(`Cal.com returned error: ${JSON.stringify(response)}`);
            }
            this.log('Booking cancelled successfully:', response);
            return response;
        } catch (error) {
            this.logError('Error cancelling booking:', error);
            throw error;
        }
    }
    async rescheduleBooking(uid, newStartTime, rescheduledBy, reschedulingReason = "") {
        if (!uid) throw new Error(this.errorMessages.missingBookingId);
        if (!this.apiKey) throw new Error(this.errorMessages.missingApiKey);
        if (!newStartTime) throw new Error(this.errorMessages.missingNewTime);
        if (!rescheduledBy) throw new Error(this.errorMessages.missingRescheduledBy);
        const body = {
            rescheduledBy: rescheduledBy,
            reschedulingReason: reschedulingReason,
            start: newStartTime
        };
        try {
            const response = await this.makeApiRequest(`/bookings/${uid}/reschedule`, {
                method: 'POST',
                body: JSON.stringify(body)
            });
            if (response.status && response.status !== "success") {
                throw new Error(`Cal.com returned error: ${JSON.stringify(response)}`);
            }
            this.log('Booking rescheduled successfully:', response);
            return response;
        } catch (error) {
            this.logError('Error rescheduling booking:', error);
            throw error;
        }
    }
    // ============================================================================
    // FIXED: CREATE BOOKING METHOD - ONLY SENDS ALLOWED FIELDS
    // ============================================================================
    async createBooking(eventTypeId, bookingData, timezone = "UTC") {
        if (!eventTypeId) throw new Error(this.errorMessages.missingEventTypeId);
        if (!this.apiKey) throw new Error(this.errorMessages.missingApiKey);
        if (!bookingData) throw new Error(this.errorMessages.missingBookingData);
        // FIXED: Only send fields that Cal.com API accepts
        const body = {
            eventTypeId: Number(eventTypeId),
            start: bookingData.start,
            attendee: {
                name: bookingData.attendeeName,
                email: bookingData.attendeeEmail,
                timeZone: timezone
            }
            // REMOVED: ...bookingData.additionalData (was causing 400 error)
            // Cal.com API doesn't accept notes, serviceType, or other custom fields
        };
        this.log('📅 Creating booking with CLEAN data:', body);
        try {
            const response = await this.makeApiRequest('/bookings', {
                method: 'POST',
                body: JSON.stringify(body)
            });
            if (response.status && response.status !== "success") {
                throw new Error(`Cal.com returned error: ${JSON.stringify(response)}`);
            }
            this.log('✅ Booking created successfully:', response);
            return response;
        } catch (error) {
            this.logError('❌ Error creating booking:', error);
            throw error;
        }
    }
    // ============================================================================
    // STANDARDIZED SUBMISSION HANDLERS
    // ============================================================================
    async handleCancellation(formData, config) {
        this.log('Handling cancellation with data:', formData);
        try {
            const cancellationReason = formData.cancellationReason ||
                formData.reason ||
                formData.cancellation_reason ||
                formData.cancel_reason;
            if (!cancellationReason || cancellationReason.trim() === '') {
                throw new Error(this.errorMessages.missingReason);
            }
            const effectiveApiKey = config.apiKey || this.apiKey;
            const originalApiKey = this.apiKey;
            this.apiKey = effectiveApiKey;
            const cancellationResult = await this.cancelBooking(config.uid, cancellationReason);
            this.apiKey = originalApiKey;
            const submissionData = this.createSubmissionData('cancellation', {
                bookingUid: config.uid,
                cancellationReason: cancellationReason,
                serviceProvider: config.serviceProvider,
                originalDateTime: config.startTime,
                cancellationDateTime: new Date()
                    .toISOString(),
                email: config.email,
                eventTypeSlug: config.eventTypeSlug,
                cancellationResult: cancellationResult
            }, config);
            this.sendToVoiceflow(config, 'cancellation_success', submissionData);
            return submissionData;
        } catch (error) {
            this.logError('Cancellation error:', error);
            this.sendToVoiceflow(config, 'cancellation_error', {
                error: error.message
            });
            throw error;
        }
    }
    async handleReschedule(formData, config) {
        this.log('Handling rescheduling with data:', formData);
        try {
            const newAppointmentData = formData.newAppointment;
            const rescheduleReason = formData.rescheduleReason || formData.reason || '';
            if (!newAppointmentData || !newAppointmentData.selectedTime) {
                throw new Error(this.errorMessages.missingNewTime);
            }
            const effectiveApiKey = config.apiKey || this.apiKey;
            const originalApiKey = this.apiKey;
            this.apiKey = effectiveApiKey;
            const rescheduleResult = await this.rescheduleBooking(
                config.uid,
                newAppointmentData.selectedTime,
                config.email,
                rescheduleReason
            );
            this.apiKey = originalApiKey;
            const submissionData = this.createSubmissionData('rescheduling', {
                bookingUid: config.uid,
                originalDateTime: config.startTime,
                newDateTime: newAppointmentData.selectedTime,
                rescheduleReason: rescheduleReason,
                serviceProvider: config.serviceProvider,
                rescheduleDateTime: new Date()
                    .toISOString(),
                email: config.email,
                eventTypeSlug: config.eventTypeSlug,
                rescheduleResult: rescheduleResult,
                formattedOriginalDate: config.startTime,
                formattedNewDate: newAppointmentData.formattedDate,
                formattedNewTime: newAppointmentData.formattedTime
            }, config);
            this.sendToVoiceflow(config, 'reschedule_success', submissionData);
            return submissionData;
        } catch (error) {
            this.logError('Rescheduling error:', error);
            this.sendToVoiceflow(config, 'reschedule_error', {
                error: error.message
            });
            throw error;
        }
    }
    // ============================================================================
    // FIXED: STANDARD BOOKING HANDLER - REMOVED ADDITIONAL DATA
    // ============================================================================
    async handleBooking(formData, config) {
        this.log('🚀 Handling booking with data:', formData);
        try {
            // Extract appointment data from calendar field
            const appointmentData = formData.appointment;
            const serviceSelection = formData.serviceSelection;
            const firstName = formData.firstName || '';
            const lastName = formData.lastName || '';
            const email = formData.email || '';
            this.log('📋 Extracted booking data:', {
                appointmentData: appointmentData,
                serviceSelection: serviceSelection,
                firstName: firstName,
                lastName: lastName,
                email: email
            });
            // Validate required data
            if (!appointmentData || !appointmentData.selectedTime) {
                throw new Error('Appointment time is required');
            }
            if (!serviceSelection || !serviceSelection.eventTypeId) {
                throw new Error('Service selection is required');
            }
            if (!firstName || !lastName) {
                throw new Error('Full name is required');
            }
            if (!email) {
                throw new Error('Email is required');
            }
            // Use the instance's API key if not provided in config
            const effectiveApiKey = config.apiKey || this.apiKey;
            const originalApiKey = this.apiKey;
            this.apiKey = effectiveApiKey;
            this.log('📞 Creating booking with Cal.com API:', {
                eventTypeId: serviceSelection.eventTypeId,
                startTime: appointmentData.selectedTime,
                attendeeName: `${firstName} ${lastName}`,
                attendeeEmail: email,
                timezone: config.timezone
            });
            // FIXED: Create the booking with only allowed fields
            const bookingResult = await this.createBooking(
                serviceSelection.eventTypeId, {
                    start: appointmentData.selectedTime,
                    attendeeName: `${firstName} ${lastName}`,
                    attendeeEmail: email
                    // REMOVED: additionalData that was causing the 400 error
                },
                config.timezone
            );
            // Restore original API key
            this.apiKey = originalApiKey;
            this.log('✅ Booking API call completed successfully:', bookingResult);
            // Prepare structured data for Voiceflow
            const submissionData = this.createSubmissionData('booking', {
                bookingId: bookingResult.data?.id || null,
                bookingUid: bookingResult.data?.uid || null,
                firstName: firstName,
                lastName: lastName,
                fullName: `${firstName} ${lastName}`,
                email: email,
                serviceTitle: serviceSelection.title || serviceSelection.name,
                serviceName: serviceSelection.eventName || serviceSelection.serviceName,
                serviceProvider: config.serviceProvider,
                eventTypeId: serviceSelection.eventTypeId,
                eventTypeSlug: serviceSelection.eventTypeSlug,
                appointmentDateTime: appointmentData.selectedTime,
                formattedDate: appointmentData.formattedDate,
                formattedTime: appointmentData.formattedTime,
                timezone: config.timezone,
                bookingDateTime: new Date()
                    .toISOString(),
                bookingResult: bookingResult,
                // Store additional data in submission data (for Voiceflow) but not sent to Cal.com
                notes: formData.notes || '',
                serviceType: serviceSelection.eventTypeSlug || ''
            }, config);
            this.log('📊 Prepared booking submission data:', submissionData);
            // Send to Voiceflow if enabled
            this.sendToVoiceflow(config, 'booking_success', submissionData);
            return submissionData;
        } catch (error) {
            this.logError('❌ Booking error:', error);
            this.sendToVoiceflow(config, 'booking_error', {
                error: error.message
            });
            throw error;
        }
    }
    // ============================================================================
    // UTILITY METHODS
    // ============================================================================
    getServiceName(eventTypeSlug, serviceProvider, serviceMapping = {}) {
        if (serviceMapping[eventTypeSlug]) {
            return serviceMapping[eventTypeSlug];
        }
        if (eventTypeSlug) {
            return eventTypeSlug
                .replace(/-/g, ' ')
                .replace(/\b\w/g, l => l.toUpperCase());
        }
        return serviceProvider || 'Appointment';
    }
    createSubmissionData(operationType, data, config) {
        return {
            sections: {
                [`${operationType}_details`]: data
            },
            submissionType: `${operationType}_form`,
            language: config.language || 'en',
            metadata: {
                transformerType: "BaseDataTransformer",
                formVersion: config.formVersion || '5.0.0',
                operationType: operationType,
                timestamp: new Date()
                    .toISOString()
            }
        };
    }
    sendToVoiceflow(config, interactionType, payload) {
        if (config.voiceflowEnabled && window.voiceflow) {
            this.log('Sending data to Voiceflow');
            window.voiceflow.chat.interact({
                type: interactionType,
                payload: payload
            });
        }
    }
    log(message, data = null) {
        if (this.enableLogging) {
            console.log(`${this.logPrefix}`, message, data || '');
        }
    }
    logError(message, error = null) {
        console.error(`${this.logPrefix} ❌`, message, error || '');
    }
    setApiKey(apiKey) {
        this.apiKey = apiKey;
    }
    setLogPrefix(prefix) {
        this.logPrefix = prefix;
    }
    // ============================================================================
    // FORM INTEGRATION HELPERS (for backward compatibility)
    // ============================================================================
    async loadAndPopulateBookingData(extension, config) {
        // This method is mainly for cancellation/reschedule extensions
        // Booking extensions don't need to load existing booking data
        if (config.uid) {
            try {
                const effectiveApiKey = config.apiKey || this.apiKey;
                const originalApiKey = this.apiKey;
                this.apiKey = effectiveApiKey;
                const bookingData = await this.fetchBooking(config.uid);
                this.apiKey = originalApiKey;
                if (bookingData && extension.factory) {
                    const bookingCardField = this.findBookingCardField(extension);
                    if (bookingCardField && bookingCardField.updateConfig) {
                        const cardData = this.formatBookingDataForCard(bookingData, config);
                        bookingCardField.updateConfig(cardData);
                    }
                }
            } catch (error) {
                this.logError('Error loading booking data:', error);
            }
        }
    }
    findBookingCardField(extension) {
        return extension.factory?.fieldRegistry?.currentAppointmentDisplay ||
            extension.singleStepForm?.fieldInstances?.find(f =>
                f.id === 'currentAppointmentDisplay' ||
                f.constructor.name === 'BookingCancellationCardField' ||
                f.constructor.name === 'CurrentAppointmentCardField'
            ) ||
            extension.multiStepForm?.getAllFieldInstances?.()
            ?.find(f =>
                f.id === 'currentAppointmentDisplay' ||
                f.constructor.name === 'BookingCancellationCardField' ||
                f.constructor.name === 'CurrentAppointmentCardField'
            );
    }
    formatBookingDataForCard(bookingData, config) {
        return {
            meetingName: bookingData.hosts?.[0]?.name || config.serviceProvider || 'Provider',
            startTime: bookingData.start || config.startTime,
            serviceName: this.getServiceName(config.eventTypeSlug, config.serviceProvider),
            bookingId: bookingData.id || '',
            bookingUid: bookingData.uid || config.uid,
            status: bookingData.status || 'confirmed',
            attendeeEmail: bookingData.attendees?.[0]?.email || config.email,
            attendeeName: bookingData.attendees?.[0]?.name || '',
            language: config.language || 'en',
            ...config.additionalCardData
        };
    }
}



// ============================================================================
// SERVICE PROVIDER CALENDAR FIELD - Generic 3-step field (Service > Provider > Calendar)
// ============================================================================
class ServiceProviderCalendarField extends BaseField {
    constructor(factory, config) {
        super(factory, config);
        
        // Core configuration
        this.language = config.language || 'fr';
        this.locale = config.locale || 'fr-FR';
        this.timezone = config.timezone || 'America/Toronto';
        
        // Data configuration
        this.servicesData = config.servicesData || [];
        this.providersData = config.providersData || [];
        this.providersInfo = config.providersInfo || {}; // Provider API configurations
        
        // Current selections
        this.selectedService = null;
        this.selectedProvider = null;
        this.appointmentData = null;
        
        // UI state
        this.currentStep = 0; // 0: Service, 1: Provider, 2: Calendar
        this.totalSteps = 3;
        
        // Field instances
        this.serviceCarousel = null;
        this.providerCarousel = null;
        this.calendarField = null;
        this.filteredProviders = [];
        
        // Callbacks
        this.onServiceChange = config.onServiceChange || null;
        this.onProviderChange = config.onProviderChange || null;
        this.onAppointmentChange = config.onAppointmentChange || null;
        this.onStepChange = config.onStepChange || null;
        
        // Translations
        this.texts = {
            services: config.texts?.services || 'Services',
            providers: config.texts?.providers || 'Providers', 
            appointment: config.texts?.appointment || 'Appointment',
            selectService: config.texts?.selectService || 'Select a Service',
            selectProvider: config.texts?.selectProvider || 'Select a Provider',
            selectAppointment: config.texts?.selectAppointment || 'Select Date & Time',
            serviceStep: config.texts?.serviceStep || 'Choose Service',
            providerStep: config.texts?.providerStep || 'Choose Provider',
            appointmentStep: config.texts?.appointmentStep || 'Schedule Appointment',
            next: config.texts?.next || 'Next',
            previous: config.texts?.previous || 'Previous',
            noProvidersAvailable: config.texts?.noProvidersAvailable || 'No providers available for this service'
        };
        
        this.init();
    }
    
    init() {
        // Filter providers for initial service if any
        if (this.selectedService) {
            this.filterProvidersByService(this.selectedService);
        } else {
            this.filteredProviders = [...this.providersData];
        }
    }
    
    filterProvidersByService(service) {
        if (!service || !service.id) {
            this.filteredProviders = [...this.providersData];
            return;
        }
        
        this.filteredProviders = this.providersData.filter(provider => 
            provider.services && provider.services.includes(service.id)
        );
        
        console.log(`Filtered ${this.filteredProviders.length} providers for service:`, service.id);
    }
    
    selectService(service) {
        console.log('🎯 Service selected:', service);
        this.selectedService = service;
        this.selectedProvider = null;
        this.appointmentData = null;
        
        // Filter providers
        this.filterProvidersByService(service);
        
        // Update provider carousel
        if (this.providerCarousel) {
            this.providerCarousel.updateItems(this.filteredProviders);
        }
        
        // Reset calendar
        if (this.calendarField) {
            this.calendarField.reset();
        }
        
        // Auto-advance to provider step
        this.goToStep(1);
        
        // Trigger callback
        if (this.onServiceChange) {
            this.onServiceChange(service, this.filteredProviders);
        }
        
        this.updateValue();
    }
    
    selectProvider(provider) {
        console.log('🎯 Provider selected:', provider);
        this.selectedProvider = provider;
        this.appointmentData = null;
        
        // Configure calendar with provider's API settings
        this.configureCalendar();
        
        // Auto-advance to calendar step
        this.goToStep(2);
        
        // Trigger callback
        if (this.onProviderChange) {
            this.onProviderChange(provider, this.selectedService);
        }
        
        this.updateValue();
    }
    
    configureCalendar() {
        if (!this.calendarField || !this.selectedProvider || !this.selectedService) {
            return;
        }
        
        const providerInfo = this.providersInfo[this.selectedProvider.name];
        const serviceConfig = providerInfo?.services?.[this.selectedService.title];
        
        if (providerInfo && serviceConfig) {
            // Update calendar configuration
            this.calendarField.apiKey = providerInfo.apiKey;
            this.calendarField.scheduleId = providerInfo.scheduleId;
            this.calendarField.eventTypeId = serviceConfig.eventId;
            this.calendarField.eventTypeSlug = serviceConfig.eventSlug;
            this.calendarField.eventName = this.selectedService.title;
            this.calendarField.specialist = this.selectedProvider.name;
            this.calendarField.selectedCategory = this.selectedService.title;
            
            console.log('📅 Calendar configured:', {
                provider: this.selectedProvider.name,
                service: this.selectedService.title,
                apiKey: providerInfo.apiKey,
                scheduleId: providerInfo.scheduleId,
                eventTypeId: serviceConfig.eventId
            });
            
            // Reinitialize calendar
            if (this.calendarField.initializeCalendar) {
                this.calendarField.initializeCalendar();
            }
            
            // Update header
            if (this.calendarField.updateCalendarHeader) {
                this.calendarField.updateCalendarHeader();
            }
        }
    }
    
    onAppointmentSelect(appointmentData) {
        console.log('🎯 Appointment selected:', appointmentData);
        this.appointmentData = appointmentData;
        
        // Trigger callback
        if (this.onAppointmentChange) {
            this.onAppointmentChange(appointmentData, this.selectedService, this.selectedProvider);
        }
        
        this.updateValue();
    }
    
    goToStep(stepIndex) {
        if (stepIndex < 0 || stepIndex >= this.totalSteps) {
            return;
        }
        
        this.currentStep = stepIndex;
        this.updateStepVisibility();
        
        if (this.onStepChange) {
            this.onStepChange(stepIndex, {
                service: this.selectedService,
                provider: this.selectedProvider,
                appointment: this.appointmentData
            });
        }
    }
    
    nextStep() {
        if (this.currentStep < this.totalSteps - 1) {
            this.goToStep(this.currentStep + 1);
        }
    }
    
    previousStep() {
        if (this.currentStep > 0) {
            this.goToStep(this.currentStep - 1);
        }
    }
    
    updateStepVisibility() {
        if (!this.element) return;
        
        const steps = this.element.querySelectorAll('.spc-step');
        steps.forEach((step, index) => {
            step.classList.toggle('active', index === this.currentStep);
            step.classList.toggle('hidden', index !== this.currentStep);
        });
        
        // Update progress indicator
        const progressSteps = this.element.querySelectorAll('.spc-progress-step');
        progressSteps.forEach((step, index) => {
            step.classList.toggle('active', index === this.currentStep);
            step.classList.toggle('completed', index < this.currentStep);
        });
        
        // Update navigation buttons
        const prevBtn = this.element.querySelector('.spc-prev-btn');
        const nextBtn = this.element.querySelector('.spc-next-btn');
        
        if (prevBtn) {
            prevBtn.style.display = this.currentStep === 0 ? 'none' : 'block';
        }
        
        if (nextBtn) {
            nextBtn.style.display = this.currentStep === this.totalSteps - 1 ? 'none' : 'block';
        }
    }
    
    render() {
        const container = this.createContainer();
        container.className += ' service-provider-calendar-field';
        
        // Add styles
        this.injectStyles();
        
        // Create progress indicator
        const progressContainer = document.createElement('div');
        progressContainer.className = 'spc-progress';
        
        const progressSteps = [
            { key: 'service', label: this.texts.serviceStep },
            { key: 'provider', label: this.texts.providerStep },
            { key: 'appointment', label: this.texts.appointmentStep }
        ];
        
        progressSteps.forEach((step, index) => {
            const stepEl = document.createElement('div');
            stepEl.className = 'spc-progress-step';
            stepEl.innerHTML = `
                <div class="spc-step-number">${index + 1}</div>
                <div class="spc-step-label">${step.label}</div>
            `;
            progressContainer.appendChild(stepEl);
        });
        
        container.appendChild(progressContainer);
        
        // Create steps container
        const stepsContainer = document.createElement('div');
        stepsContainer.className = 'spc-steps';
        
        // Step 1: Service Selection
        const serviceStep = this.createServiceStep();
        stepsContainer.appendChild(serviceStep);
        
        // Step 2: Provider Selection  
        const providerStep = this.createProviderStep();
        stepsContainer.appendChild(providerStep);
        
        // Step 3: Calendar
        const calendarStep = this.createCalendarStep();
        stepsContainer.appendChild(calendarStep);
        
        container.appendChild(stepsContainer);
        
        // Create navigation
        const navigation = this.createNavigation();
        container.appendChild(navigation);
        
        // Create error element
        const errorElement = this.createErrorElement();
        container.appendChild(errorElement);
        
        this.element = container;
        this.element.fieldInstance = this;
        
        // Initialize step visibility
        this.updateStepVisibility();
        
        return this.element;
    }
    
    createServiceStep() {
        const step = document.createElement('div');
        step.className = 'spc-step spc-service-step';
        
        const title = document.createElement('span');
        title.className = 'spc-step-title';
        title.textContent = this.texts.selectService;
        step.appendChild(title);
        
        // Create service carousel using CarouselField pattern
        this.serviceCarousel = new CarouselField(this.factory, {
            id: `${this.id}-service`,
            name: `${this.name}_service`,
            items: this.servicesData,
            title: '',
            itemType: 'service',
            showDetails: true,
            layout: 'grid',
            columns: 'auto'
        });
        
        // Override selectItem to handle our logic
        const originalSelectItem = this.serviceCarousel.selectItem.bind(this.serviceCarousel);
        this.serviceCarousel.selectItem = (index) => {
            originalSelectItem(index);
            const selectedService = this.servicesData[index];
            if (selectedService) {
                this.selectService(selectedService);
            }
        };
        
        step.appendChild(this.serviceCarousel.render());
        return step;
    }
    
    createProviderStep() {
        const step = document.createElement('div');
        step.className = 'spc-step spc-provider-step';
        
        const title = document.createElement('pan');
        title.className = 'spc-step-title';
        title.textContent = this.texts.selectProvider;
        step.appendChild(title);
        
        // Create provider carousel
        this.providerCarousel = new CarouselField(this.factory, {
            id: `${this.id}-provider`,
            name: `${this.name}_provider`,
            items: this.filteredProviders,
            title: '',
            itemType: 'staff',
            showDetails: true,
            layout: 'grid',
            columns: 'auto'
        });
        
        // Override selectItem to handle our logic
        const originalSelectItem = this.providerCarousel.selectItem.bind(this.providerCarousel);
        this.providerCarousel.selectItem = (index) => {
            originalSelectItem(index);
            const selectedProvider = this.filteredProviders[index];
            if (selectedProvider) {
                this.selectProvider(selectedProvider);
            }
        };
        
        step.appendChild(this.providerCarousel.render());
        return step;
    }
    
    createCalendarStep() {
        const step = document.createElement('div');
        step.className = 'spc-step spc-calendar-step';
        
        const title = document.createElement('span');
        title.className = 'spc-step-title';
        title.textContent = this.texts.selectAppointment;
        step.appendChild(title);
        
        // Create calendar field
        this.calendarField = new CalendarField(this.factory, {
            id: `${this.id}-calendar`,
            name: `${this.name}_calendar`,
            required: this.required,
            mode: 'booking',
            selectionMode: 'none',
            timezone: this.timezone,
            language: this.language,
            locale: this.locale,
            onChange: (value) => this.onAppointmentSelect(value)
        });
        
        step.appendChild(this.calendarField.render());
        return step;
    }
    
    createNavigation() {
        const nav = document.createElement('div');
        nav.className = 'spc-navigation';
        
        const prevBtn = document.createElement('button');
        prevBtn.type = 'button';
        prevBtn.className = 'spc-nav-btn spc-prev-btn';
        prevBtn.textContent = this.texts.previous;
        prevBtn.addEventListener('click', () => this.previousStep());
        
        const nextBtn = document.createElement('button');
        nextBtn.type = 'button';
        nextBtn.className = 'spc-nav-btn spc-next-btn';
        nextBtn.textContent = this.texts.next;
        nextBtn.addEventListener('click', () => this.nextStep());
        
        nav.appendChild(prevBtn);
        nav.appendChild(nextBtn);
        
        return nav;
    }
    
    injectStyles() {
        if (document.querySelector('#spc-styles')) return;
        
        const styles = `
            <style id="spc-styles">
                .service-provider-calendar-field {
                    width: 100%;
                    max-width: 800px;
                    margin: 0 auto;
                }
                
                .spc-progress {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 30px;
                    position: relative;
                }
                
                .spc-progress::before {
                    content: '';
                    position: absolute;
                    top: 20px;
                    left: 10%;
                    right: 10%;
                    height: 2px;
                    background: #e1e5e9;
                    z-index: 1;
                }
                
                .spc-progress-step {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    position: relative;
                    z-index: 2;
                    flex: 1;
                }
                
                .spc-step-number {
                    width: 40px;
                    height: 40px;
                    border-radius: 50%;
                    background: #e1e5e9;
                    color: #6c757d;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-weight: 600;
                    margin-bottom: 8px;
                    transition: all 0.3s ease;
                }
                
                .spc-progress-step.active .spc-step-number {
                    background: #007bff;
                    color: white;
                }
                
                .spc-progress-step.completed .spc-step-number {
                    background: #28a745;
                    color: white;
                }
                
                .spc-step-label {
                    font-size: 0.9rem;
                    color: #6c757d;
                    text-align: center;
                    transition: color 0.3s ease;
                }
                
                .spc-progress-step.active .spc-step-label {
                    color: #007bff;
                    font-weight: 600;
                }
                
                .spc-steps {
                    min-height: 400px;
                    margin-bottom: 20px;
                }
                
                .spc-step {
                    display: none;
                }
                
                .spc-step.active {
                    display: block;
                    animation: fadeIn 0.3s ease;
                }
                
                .spc-step-title {
                    text-align: center;
                    margin-bottom: 20px;
                    color: #2c3e50;
                    font-size: 1.5rem;
                }
                
                .spc-navigation {
                    display: flex;
                    justify-content: space-between;
                    margin-top: 20px;
                }
                
                .spc-nav-btn {
                    padding: 12px 24px;
                    border: none;
                    border-radius: 6px;
                    background: #007bff;
                    color: white;
                    font-weight: 600;
                    cursor: pointer;
                    transition: background 0.3s ease;
                }
                
                .spc-nav-btn:hover {
                    background: #0056b3;
                }
                
                .spc-nav-btn:disabled {
                    background: #6c757d;
                    cursor: not-allowed;
                }
                
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            </style>
        `;
        
        document.head.insertAdjacentHTML('beforeend', styles);
    }
    
    validate() {
        if (!this.required) return true;
        
        if (!this.selectedService) {
            this.showError('Please select a service');
            return false;
        }
        
        if (!this.selectedProvider) {
            this.showError('Please select a provider');
            return false;
        }
        
        if (!this.appointmentData) {
            this.showError('Please select an appointment time');
            return false;
        }
        
        this.hideError();
        return true;
    }
    
    getValue() {
        return {
            selectedService: this.selectedService,
            selectedProvider: this.selectedProvider,
            appointment: this.appointmentData,
            currentStep: this.currentStep,
            isComplete: !!(this.selectedService && this.selectedProvider && this.appointmentData)
        };
    }
    
    setValue(value) {
        if (!value) return;
        
        if (value.selectedService) {
            this.selectedService = value.selectedService;
            this.filterProvidersByService(value.selectedService);
        }
        
        if (value.selectedProvider) {
            this.selectedProvider = value.selectedProvider;
            this.configureCalendar();
        }
        
        if (value.appointment) {
            this.appointmentData = value.appointment;
        }
        
        if (value.currentStep !== undefined) {
            this.goToStep(value.currentStep);
        }
        
        this.updateValue();
    }
    
    updateValue() {
        this.handleChange();
    }
    
    reset() {
        this.selectedService = null;
        this.selectedProvider = null;
        this.appointmentData = null;
        this.currentStep = 0;
        this.filteredProviders = [...this.providersData];
        
        if (this.serviceCarousel) {
            this.serviceCarousel.selectedItem = null;
            this.serviceCarousel.selectedItems = [];
            this.serviceCarousel.updateSelection();
        }
        
        if (this.providerCarousel) {
            this.providerCarousel.updateItems(this.filteredProviders);
        }
        
        if (this.calendarField) {
            this.calendarField.reset();
        }
        
        this.updateStepVisibility();
        this.updateValue();
    }
    
    destroy() {
        if (this.serviceCarousel && typeof this.serviceCarousel.destroy === 'function') {
            this.serviceCarousel.destroy();
        }
        if (this.providerCarousel && typeof this.providerCarousel.destroy === 'function') {
            this.providerCarousel.destroy();
        }
        if (this.calendarField && typeof this.calendarField.destroy === 'function') {
            this.calendarField.destroy();
        }
        super.destroy();
    }
}

// Base Carousel Class - Contains all shared functionality
class BaseCarouselField extends BaseField {
    constructor(factory, config) {
        super(factory, config);
        this.config = config;
        this.items = config.items || [];
        this.selectedItem = null;
        this.currentIndex = 0;
        this.showNavigation = config.showNavigation !== false;
        this.title = config.title || '';
        this.subtitle = config.subtitle || '';
        this.itemType = config.itemType || 'generic';
        this.allowMultiple = config.allowMultiple || false;
        this.selectedItems = [];
        this.showDetails = config.showDetails !== false;
        
        // Responsive configuration
        this.responsiveConfig = {
            mobile: { itemsPerView: 1, cardWidth: 200 },
            tablet: { itemsPerView: 2, cardWidth: 220 },
            desktop: { itemsPerView: 3, cardWidth: 250 },
            ...config.responsiveConfig
        };
        
        this.itemsPerView = this.getItemsPerView();
        this.gap = 16;
        
        // Cache DOM queries
        this.domCache = new Map();
        
        // Bind methods once with debouncing
        this.handleResize = this.debounce(this.handleResize.bind(this), 150);
        this.selectItem = this.selectItem.bind(this);
    }

    // Utility method for debouncing
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // Responsive breakpoint detection
    getBreakpoint() {
        const width = window.innerWidth;
        if (width < 768) return 'mobile';
        if (width < 1024) return 'tablet';
        return 'desktop';
    }

    getItemsPerView() {
        const breakpoint = this.getBreakpoint();
        return this.responsiveConfig[breakpoint].itemsPerView;
    }

    getCardWidth() {
        const breakpoint = this.getBreakpoint();
        return this.responsiveConfig[breakpoint].cardWidth;
    }

    handleResize() {
        const newItemsPerView = this.getItemsPerView();
        if (newItemsPerView !== this.itemsPerView) {
            this.itemsPerView = newItemsPerView;
            
            // Reset current index, but consider centering
            const shouldCenter = this.items.length <= this.itemsPerView;
            if (shouldCenter) {
                this.currentIndex = 0;
            } else {
                this.currentIndex = Math.min(this.currentIndex, Math.max(0, this.items.length - this.itemsPerView));
            }
            
            // Update container sizing for new viewport
            this.updateContainerSizing();
            this.updateTrackPosition();
            this.updateNavigationState();
            
            console.log(`📱 RESIZE: ${this.itemsPerView} cards per view, ${this.items.length} total cards`);
        }
    }

    render() {
        this.container = this.createContainer();
        this.container.className += ' carousel-field';
        this.createCarouselStructure();
        this.setupEventListeners();
        this.renderItems();
        this.updateNavigation();
        this.postRender(); // Hook for subclasses
        
        return this.container;
    }

    // Hook for subclasses to override
    postRender() {}

    createCarouselStructure() {
        const fragment = document.createDocumentFragment();
        
        this.galleryContainer = document.createElement('div');
        this.galleryContainer.className = 'carousel-gallery-container';
        
        const contentWrapper = document.createElement('div');
        contentWrapper.className = 'carousel-content-wrapper';
        
        // Carousel section
        const carouselWrapper = document.createElement('div');
        carouselWrapper.className = 'carousel-image-container';
        
        const carouselContainer = document.createElement('div');
        carouselContainer.className = 'carousel-cards-container';
        
        this.track = document.createElement('div');
        this.track.className = 'carousel-track';
        carouselContainer.appendChild(this.track);
        carouselWrapper.appendChild(carouselContainer);

        // Navigation buttons
        if (this.showNavigation) {
            const { prevButton, nextButton } = this.createNavigationButtons();
            this.prevButton = prevButton;
            this.nextButton = nextButton;
            carouselWrapper.appendChild(prevButton);
            carouselWrapper.appendChild(nextButton);
        }

        contentWrapper.appendChild(carouselWrapper);
        this.galleryContainer.appendChild(contentWrapper);
        fragment.appendChild(this.galleryContainer);
        this.container.appendChild(fragment);
    }



    createNavigationButtons() {
        const prevButton = document.createElement('button');
        prevButton.type = 'button';
        prevButton.className = 'carousel-nav-btn carousel-prev-btn';
        prevButton.innerHTML = '<svg viewBox="0 0 24 24" width="16" height="16"><path d="M15.41 16.59L10.83 12l4.58-4.59L14 6l-6 6 6 6 1.41-1.41z" fill="currentColor"/></svg>';
        prevButton.setAttribute('aria-label', 'Previous');

        const nextButton = document.createElement('button');
        nextButton.type = 'button';
        nextButton.className = 'carousel-nav-btn carousel-next-btn';
        nextButton.innerHTML = '<svg viewBox="0 0 24 24" width="16" height="16"><path d="M8.59 16.59L13.17 12L8.59 7.41L10 6l6 6-6 6-1.41-1.41z" fill="currentColor"/></svg>';
        nextButton.setAttribute('aria-label', 'Next');

        return { prevButton, nextButton };
    }

    setupEventListeners() {
        // Navigation events
        if (this.prevButton && this.nextButton) {
            this.prevButton.addEventListener('click', this.createNavigationHandler('prev'));
            this.nextButton.addEventListener('click', this.createNavigationHandler('next'));
        }

        // Resize event
        window.addEventListener('resize', this.handleResize);
        
        // Additional listeners for subclasses
        this.setupAdditionalListeners();
    }

    // Hook for subclasses
    setupAdditionalListeners() {}

    createNavigationHandler(direction) {
        return (event) => {
            event.preventDefault();
            event.stopPropagation();
            direction === 'prev' ? this.previousSlide() : this.nextSlide();
        };
    }

    renderItems() {
        if (!this.track) return;
        
        // Clear existing items
        this.track.innerHTML = '';
        
        if (this.items.length === 0) {
            this.renderEmptyState();
            this.updateContainerSizing();
            return;
        }
        
        // Use document fragment for better performance
        const fragment = document.createDocumentFragment();
        this.items.forEach((item, index) => {
            const itemElement = this.createItemElement(item, index);
            fragment.appendChild(itemElement);
        });
        
        this.track.appendChild(fragment);
        this.updateContainerSizing();
        this.updateTrackPosition();
    }

    updateContainerSizing() {
        if (!this.galleryContainer) return;
        
        const carouselContainer = this.galleryContainer.querySelector('.carousel-cards-container');
        if (!carouselContainer) return;
        
        // Remove existing sizing classes
        carouselContainer.classList.remove('container-1-card', 'container-2-cards');
        
        // Add appropriate sizing class based on number of items and viewport
        if (this.items.length === 0) {
            // Keep default size for empty state
            return;
        }
        
        const shouldCenter = this.items.length <= this.itemsPerView;
        
        if (shouldCenter) {
            if (this.items.length === 1) {
                carouselContainer.classList.add('container-1-card');
                console.log('📦 CONTAINER: Sized for 1 card (centered)');
            } else if (this.items.length === 2 && this.itemsPerView >= 2) {
                carouselContainer.classList.add('container-2-cards');
                console.log('📦 CONTAINER: Sized for 2 cards (centered)');
            }
        }
    }

    renderEmptyState() {
        const emptyMessage = document.createElement('div');
        emptyMessage.className = 'carousel-empty-message';
        emptyMessage.innerHTML = `
            <div class="empty-state">
                <div class="empty-message">${this.getEmptyMessage()}</div>
                ${this.getEmptySubMessage() ? `<div class="empty-submessage">${this.getEmptySubMessage()}</div>` : ''}
            </div>
        `;
        this.track.appendChild(emptyMessage);
    }

    // Hooks for subclasses to customize empty state
    getEmptyMessage() {
        return this.config.emptyMessage || 'No items available';
    }

    getEmptySubMessage() {
        return '';
    }

    createItemElement(item, index) {
        const itemEl = document.createElement('div');
        itemEl.className = 'carousel-item';
        itemEl.dataset.index = index;

        // Image
        if (item.image) {
            itemEl.appendChild(this.createItemImage(item));
        }

        // Content
        itemEl.appendChild(this.createItemContent(item));
        
        // Event listener
        itemEl.addEventListener('click', () => this.selectItem(index));
        
        return itemEl;
    }

    createItemImage(item) {
        const img = document.createElement('img');
        img.className = 'carousel-item-image';
        img.src = item.image;
        img.alt = item.title || item.name || '';
        img.loading = 'lazy'; // Performance improvement
        img.addEventListener('error', () => {
            img.style.display = 'none';
        });
        return img;
    }

    createItemContent(item) {
        const content = document.createElement('div');
        content.className = 'carousel-item-content';

        // Title
        if (item.title || item.name) {
            const title = document.createElement('span');
            title.className = 'carousel-item-title';
            title.textContent = item.title || item.name;
            content.appendChild(title);
        }

        // Subtitle
        if (item.position || item.category) {
            const subtitle = document.createElement('p');
            subtitle.className = 'carousel-item-subtitle';
            subtitle.textContent = item.position || item.category;
            content.appendChild(subtitle);
        }

        // Description
        if (item.description) {
            const desc = document.createElement('p');
            desc.className = 'carousel-item-description';
            desc.textContent = item.description;
            content.appendChild(desc);
        }

        // Details
        if (this.showDetails) {
            const details = this.createItemDetails(item);
            if (details.children.length > 0) {
                content.appendChild(details);
            }
        }

        return content;
    }

    createItemDetails(item) {
        const details = document.createElement('div');
        details.className = 'carousel-item-details';

        const detailItems = [
            { key: 'price', value: item.price, className: 'carousel-item-price' },
            { key: 'duration', value: item.duration, className: 'carousel-item-duration' },
            { key: 'experience', value: item.experience ? `${item.experience} années d'expérience` : null, className: 'carousel-item-experience' }
        ];

        detailItems.forEach(({ value, className }) => {
            if (value) {
                const span = document.createElement('span');
                span.className = className;
                span.textContent = value;
                details.appendChild(span);
            }
        });

        return details;
    }

    selectItem(index) {
        if (this.allowMultiple) {
            this.toggleMultipleSelection(index);
        } else {
            this.setSingleSelection(index);
        }

        this.updateSelection();
        this.handleChange();
    }

    toggleMultipleSelection(index) {
        const existingIndex = this.selectedItems.indexOf(index);
        if (existingIndex > -1) {
            this.selectedItems.splice(existingIndex, 1);
        } else {
            this.selectedItems.push(index);
        }
    }

    setSingleSelection(index) {
        this.selectedItem = index;
        this.selectedItems = [index];
    }

    updateSelection() {
        // Use cached query if available
        let items = this.domCache.get('carousel-items');
        if (!items) {
            items = this.track.querySelectorAll('.carousel-item');
            this.domCache.set('carousel-items', items);
        }

        items.forEach((item, index) => {
            item.classList.toggle('selected', this.selectedItems.includes(index));
        });
    }

    nextSlide() {
        const maxSlides = Math.max(0, this.items.length - this.itemsPerView);
        if (this.currentIndex < maxSlides) {
            this.currentIndex++;
            this.updateTrackPosition();
            this.updateNavigationState();
        }
    }

    previousSlide() {
        if (this.currentIndex > 0) {
            this.currentIndex--;
            this.updateTrackPosition();
            this.updateNavigationState();
        }
    }

    updateTrackPosition() {
        if (!this.track || this.items.length === 0) return;
        
        // Check if we should center the cards
        const shouldCenter = this.items.length <= this.itemsPerView;
        
        if (shouldCenter) {
            // Center the cards
            this.track.classList.add('centered');
            this.track.style.transform = 'none';
            console.log(`🎯 CENTERING: ${this.items.length} cards (capacity: ${this.itemsPerView})`);
        } else {
            // Normal sliding behavior
            this.track.classList.remove('centered');
            const cardWidth = this.getCardWidth();
            const translateX = -(this.currentIndex * (cardWidth + this.gap));
            
            // Use transform3d for better performance
            this.track.style.transform = `translate3d(${translateX}px, 0, 0)`;
        }
    }

    updateNavigation() {
        this.updateNavigationState();
    }

    updateNavigationState() {
        if (!this.prevButton || !this.nextButton) return;
        
        const maxSlides = Math.max(0, this.items.length - this.itemsPerView);
        const shouldShowNavigation = this.items.length > this.itemsPerView;
        const shouldCenter = this.items.length <= this.itemsPerView;
        
        // Update button states
        this.prevButton.disabled = this.currentIndex === 0;
        this.nextButton.disabled = this.currentIndex >= maxSlides;
        
        // Show/hide buttons - hide when centered or not enough items
        this.prevButton.style.display = shouldShowNavigation && !shouldCenter ? 'flex' : 'none';
        this.nextButton.style.display = shouldShowNavigation && !shouldCenter ? 'flex' : 'none';
        
        if (shouldCenter) {
            console.log(`🎯 NAVIGATION: Hidden (${this.items.length} cards centered)`);
        }
    }

    getValue() {
        if (this.allowMultiple) {
            return this.selectedItems.map(index => this.items[index]).filter(Boolean);
        } else {
            return this.selectedItem !== null ? this.items[this.selectedItem] : null;
        }
    }

    setValue(value) {
        if (this.allowMultiple && Array.isArray(value)) {
            this.selectedItems = value
                .map(item => this.items.findIndex(i => i.id === item.id))
                .filter(index => index !== -1);
        } else if (value) {
            this.selectedItem = this.items.findIndex(item => item.id === value.id);
            this.selectedItems = this.selectedItem !== -1 ? [this.selectedItem] : [];
        } else {
            this.selectedItem = null;
            this.selectedItems = [];
        }
        this.updateSelection();
    }

    validate() {
        if (this.required && this.selectedItems.length === 0) {
            this.showError(this.getFieldErrorMessage('required'));
            return false;
        }
        this.hideError();
        return true;
    }

    cleanup() {
        // Clear intervals and timeouts
        this.cleanupAutoUpdate();
        
        // Remove event listeners
        window.removeEventListener('resize', this.handleResize);
        
        // Clear DOM cache
        this.domCache.clear();
        
        super.cleanup();
    }

    // Hook for subclasses
    cleanupAutoUpdate() {}

    // Invalidate DOM cache when items change
    invalidateCache() {
        this.domCache.clear();
    }
}

// Regular Carousel Field - Thin wrapper
class CarouselField extends BaseCarouselField {
    constructor(factory, config) {
        super(factory, config);
        this.container?.classList.add('standard-carousel');
    }
}

// Dynamic Filtered Carousel Field - Direct Event-Driven Solution
class FilteredCarouselField extends BaseCarouselField {
    constructor(factory, config) {
        super(factory, config);
        
        // Simplified filtering configuration - no monitoring
        this.filterConfig = {
            dependsOn: null,
            dataSource: [],
            filterFunction: null,
            waitingMessage: 'Please make a selection first',
            ...config.filterConfig
        };

        this._lastDependencyValue = null;
        this.container?.classList.add('filtered-carousel');
        
        // Register this field for direct updates
        this.registerForDependencyUpdates();
    }

    registerForDependencyUpdates() {
        if (!this.filterConfig.dependsOn) return;
        
        // Register this field in a global registry for direct updates
        if (!window._fieldDependencyRegistry) {
            window._fieldDependencyRegistry = new Map();
        }
        
        const dependsOn = this.filterConfig.dependsOn;
        if (!window._fieldDependencyRegistry.has(dependsOn)) {
            window._fieldDependencyRegistry.set(dependsOn, new Set());
        }
        
        window._fieldDependencyRegistry.get(dependsOn).add(this);
        
        console.log(`🔗 DYNAMIC FILTER [${this.name}]: Registered for ${dependsOn} updates`);
    }

    postRender() {
        // Try to populate immediately if dependency value already exists
        this.updateFromDependency();
    }

    getEmptyMessage() {
        return this.filterConfig.dependsOn ? 
            this.filterConfig.waitingMessage : 
            this.config.emptyMessage || 'No items available';
    }

    getEmptySubMessage() {
        return '';
    }

    // Direct update method called when dependency changes
    updateFromDependency(dependencyValue = null) {
        if (!this.filterConfig.dependsOn || !this.filterConfig.filterFunction) {
            console.warn(`🔄 DYNAMIC FILTER [${this.name}]: Missing filterConfig.dependsOn or filterFunction`);
            return false;
        }
        
        // Get current dependency value if not provided
        if (dependencyValue === null) {
            dependencyValue = this.getCurrentDependencyValue();
        }
        
        console.log(`🔄 DYNAMIC FILTER [${this.name}]: Updating for dependency:`, dependencyValue);
        
        // Skip if same value as before
        if (dependencyValue && this._lastDependencyValue && 
            JSON.stringify(dependencyValue) === JSON.stringify(this._lastDependencyValue)) {
            console.log(`🔄 DYNAMIC FILTER [${this.name}]: Same dependency value, skipping update`);
            return false;
        }
        
        this._lastDependencyValue = dependencyValue;
        
        if (dependencyValue) {
            const filteredItems = this.filterConfig.filterFunction(this.filterConfig.dataSource, dependencyValue);
            console.log(`🔄 DYNAMIC FILTER [${this.name}]: Filtered to ${filteredItems.length} items`);
            return this.updateItems(filteredItems);
        } else {
            // Clear items if no dependency value
            console.log(`🔄 DYNAMIC FILTER [${this.name}]: Clearing items - no dependency value`);
            return this.updateItems([]);
        }
    }

    getCurrentDependencyValue() {
        // Direct access to form values
        const formData = this.factory?.getFormData?.() || 
                        this.factory?.currentMultiStepForm?.getFormData?.() || 
                        this.factory?.formValues || {};
        
        return formData[this.filterConfig.dependsOn];
    }

    updateItems(newItems) {
        const hasChanged = newItems.length !== this.items.length || 
                          JSON.stringify(newItems) !== JSON.stringify(this.items);
        
        if (!hasChanged) return false;

        // Check if current selection is still valid
        const needsSelectionReset = this.shouldResetSelection(newItems);
        
        this.items = newItems;
        this.invalidateCache(); // Clear DOM cache
        
        if (needsSelectionReset) {
            this.resetSelection();
        }
        
        this.currentIndex = 0;
        
        if (this.galleryContainer) {
            this.renderItems();
            this.updateNavigation();
        }
        
        return true;
    }

    shouldResetSelection(newItems) {
        if (this.selectedItem === null || !this.items[this.selectedItem]) {
            return false;
        }
        
        const currentSelection = this.items[this.selectedItem];
        return !newItems.some(item => item.id === currentSelection.id);
    }

    resetSelection() {
        this.selectedItem = null;
        this.selectedItems = [];
        this.handleChange();
    }

    // Clean up when field is destroyed
    cleanup() {
        if (window._fieldDependencyRegistry && this.filterConfig.dependsOn) {
            const dependsOn = this.filterConfig.dependsOn;
            const registry = window._fieldDependencyRegistry.get(dependsOn);
            if (registry) {
                registry.delete(this);
                if (registry.size === 0) {
                    window._fieldDependencyRegistry.delete(dependsOn);
                }
            }
        }
        super.cleanup();
    }
}

// Global function to notify dependent fields of changes
window.notifyFieldDependents = function(fieldName, newValue) {
    if (!window._fieldDependencyRegistry) return;
    
    const dependentFields = window._fieldDependencyRegistry.get(fieldName);
    if (!dependentFields) return;
    
    console.log(`🔗 DEPENDENCY UPDATE: Notifying ${dependentFields.size} fields that ${fieldName} changed`);
    
    dependentFields.forEach(field => {
        if (field && field.updateFromDependency) {
            field.updateFromDependency(newValue);
        }
    });
};

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        FieldValueFormatter, // ← Add
        FormDataProcessor, // ← Add  
        ChatbotFormDataTransformer, // ← Add
        FormFieldFactory,
        CreatForm,
        MultiStepForm,
        CalComBaseUtility
    };
} else {
    window.FieldValueFormatter = FieldValueFormatter; // ← Add
    window.BaseDataTransformer = BaseDataTransformer; // ← Add
    window.FormDataProcessor = FormDataProcessor; // ← Add
    window.FormFieldFactory = FormFieldFactory;
    window.CreatForm = CreatForm;
    window.MultiStepForm = MultiStepForm;
    window.CalComBaseUtility = CalComBaseUtility;
}
