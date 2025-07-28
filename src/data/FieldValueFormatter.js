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

export default FieldValueFormatter;

