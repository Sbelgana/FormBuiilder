// ============================================================================
// CONFIGURATION CONSTANTS
// ============================================================================
const CONFIG = {
    DEFAULT_CSS: [
        'https://cdn.jsdelivr.net/gh/Sbelgana/AI_NextGen@7f4c935/FormFields.css',
        'https://cdn.jsdelivr.net/gh/Sbelgana/AI_NextGen@7881a02/calculatorExtension.css'
    ],
    SESSION_TIMEOUT: 900000, // 15 minutes for calculator
    SESSION_WARNING: 780000, // 13 minutes
    DEBOUNCE_DELAY: 50,
    FORM_VERSION: '5.0.0',
    PAYMENT_FREQUENCIES: {
        weekly: 52,
        biweekly: 26,
        monthly: 12
    },
    MIN_DOWN_PAYMENT_PERCENTAGE: 0.05,
    MAX_DEBT_RATIO: 0.32
};
// ============================================================================
// ENHANCED PROPERTY SEARCH FORM EXTENSION - REWRITTEN WITH GENERIC APPROACH
// ============================================================================
const PropertySearchFormExtension = {
    name: "PropertySearchForm",
    type: "response",
    match: ({
        trace
    }) => trace.type === "ext_property_search_form" || trace.payload?.name === "ext_property_search_form",
    render: async ({
        trace,
        element
    }) => {
        // ============================================================================
        // EXTRACT ALL PAYLOAD DATA INTO VARIABLES USING DESTRUCTURING
        // Following the improved pattern from SubmissionFormExtension
        // ============================================================================
        let {
            language = "fr",
                vf,
                webhookEnabled = false, // Property search doesn't need webhook
                webhookUrl = null,
                voiceflowEnabled = true,
                voiceflowDataTransformer = PropertySearchFormExtension.transformDataForVoiceflow,
                enableDetailedLogging = true,
                logPrefix = "🏠 PropertySearch",
                enableSessionTimeout = true,
                sessionTimeout = CONFIG.SESSION_TIMEOUT,
                sessionWarning = CONFIG.SESSION_WARNING,
                cssUrls = CONFIG.DEFAULT_CSS,
                formType = "property_search",
                formStructure = "multistep",
                useStructuredData = true,
                dataTransformer = PropertySearchFormExtension.PropertySearchDataTransformer,
                sliderRefreshDelay = CONFIG.SLIDER_REFRESH_DELAY
        } = trace.payload || {};
        // Helper function to get translated text
        const getTranslatedText = (key, lang = language) => {
            const keys = key.split('.');
            let value = PropertySearchFormExtension.FORM_DATA.translations[lang];
            for (const k of keys) {
                value = value?.[k];
            }
            return value || key;
        };
        // ============================================================================
        // NEW ARCHITECTURE: Using generic approach with custom transformer
        // Following the same pattern as SubmissionFormExtension
        // ============================================================================
        // Create the form with the new generic architecture using extracted variables
        const extension = new CreatForm({
                language: language,
                formType: formType,
                formStructure: formStructure,
                // ============================================================================
                // ENABLED: Generic approach with PropertySearchDataTransformer
                // ============================================================================
                useStructuredData: useStructuredData,
                dataTransformer: dataTransformer, // Custom transformer for property search
                // DISABLED: Webhook integration (property search doesn't need webhook)
                webhookEnabled: webhookEnabled,
                webhookUrl: webhookUrl,
                // ENABLED: Voiceflow integration with custom transformer
                voiceflowEnabled: voiceflowEnabled,
                voiceflowDataTransformer: voiceflowDataTransformer,
                // Enhanced logging using extracted variables
                enableDetailedLogging: enableDetailedLogging,
                logPrefix: logPrefix,
                // Session management using extracted variables
                enableSessionTimeout: enableSessionTimeout,
                sessionTimeout: sessionTimeout,
                sessionWarning: sessionWarning,
                // CSS configuration using extracted variables
                cssUrls: cssUrls
            },
            PropertySearchFormExtension.FORM_DATA,
            PropertySearchFormExtension.FORM_CONFIG, {
                DEFAULT_WEBHOOK: CONFIG.DEFAULT_WEBHOOK,
                DEFAULT_CSS: CONFIG.DEFAULT_CSS,
                SESSION_TIMEOUT: CONFIG.SESSION_TIMEOUT,
                SESSION_WARNING: CONFIG.SESSION_WARNING,
                DEBOUNCE_DELAY: CONFIG.DEBOUNCE_DELAY,
                FORM_VERSION: CONFIG.FORM_VERSION,
                SLIDER_REFRESH_DELAY: sliderRefreshDelay
            }
        );
        return await extension.render(element);
    },
    // ============================================================================
    // PROPERTY SEARCH DATA TRANSFORMER - Internal transformer class
    // ============================================================================
    PropertySearchDataTransformer: class extends BaseDataTransformer {
        constructor(creatFormInstance) {
            super(creatFormInstance);
            this.processor = new FormDataProcessor(creatFormInstance);
        }
        /**
         * Check if value represents "indifferent" or "any" choice
         */
        isIndifferentValue(value, fieldConfig) {
            if (fieldConfig?.type === 'options-slider') {
                // For options-slider, value 0 typically means "indifferent"
                if (typeof value === 'object' && value.value !== undefined) {
                    return value.value === 0;
                }
                return value === 0;
            }
            // Check for explicit indifferent values
            if (typeof value === 'string') {
                const lowerValue = value.toLowerCase();
                return lowerValue.includes('indifférent') ||
                    lowerValue.includes('indifferent') ||
                    lowerValue.includes('any') ||
                    lowerValue === '';
            }
            return false;
        }
        /**
         * Main transformation with Airtable formula generation
         */
        transform(originalFormValues) {
            console.log('🏠 PropertySearchDataTransformer: Starting transformation...', {
                originalFormValues
            });
            // Process form data using enhanced processor
            const processedData = this.processor.processFormData(originalFormValues);
            // Extract search criteria for Airtable formula
            const searchCriteria = this.extractSearchCriteria(processedData, originalFormValues);
            // Generate Airtable formula
            const airtableFormula = this.generateAirtableFormula(searchCriteria);
            console.log('🏠 PropertySearchDataTransformer: Generated Airtable formula:', airtableFormula);
            // Create structured format
            return {
                submissionType: 'property_search',
                formVersion: this.getFormVersion(),
                submissionTimestamp: new Date()
                    .toISOString(),
                language: this.language,
                // Property search specific data
                searchCriteria: searchCriteria,
                airtableFormula: airtableFormula,
                hasValidCriteria: airtableFormula.length > 0,
                // Create sections using processed data
                sections: this.processor.createSections(processedData),
                // Keep processed field data for direct access
                processedFields: processedData,
                // Add metadata
                metadata: this.generateMetadata(originalFormValues, processedData, searchCriteria)
            };
        }
        /**
         * Extract search criteria from processed data and original form values
         */
        extractSearchCriteria(processedData, originalFormValues) {
            const criteria = {};
            // Helper function to extract array values
            const extractArrayValues = (value) => {
                if (!value) return [];
                if (Array.isArray(value)) return value;
                if (typeof value === 'string') {
                    if (value.trim() === '') return [];
                    return value.split(',')
                        .map(v => v.trim())
                        .filter(Boolean);
                }
                return [value];
            };
            // Helper function to extract numeric value
            const extractNumericValue = (value, fieldName = '') => {
                // Check if it's an indifferent value first
                if (this.isIndifferentValue(value, {
                        type: 'options-slider'
                    })) {
                    return 0;
                }
                if (typeof value === 'number') return value;
                if (typeof value === 'object' && value !== null) {
                    if (value.value !== undefined) return value.value;
                    if (value.display && value.display.toLowerCase()
                        .includes('indifférent')) return 0;
                }
                if (typeof value === 'string') {
                    if (value.toLowerCase()
                        .includes('indifférent') ||
                        value.toLowerCase()
                        .includes('any') ||
                        value === '0' || value.trim() === '') {
                        return 0;
                    }
                    const num = parseInt(value.replace(/\D/g, ''));
                    return isNaN(num) ? 0 : num;
                }
                return 0;
            };
            // Helper function to extract price range
            const extractPriceRange = (priceRangeValue) => {
                let priceMin = 0,
                    priceMax = 0;
                console.log('🏠 PropertySearchDataTransformer 💰 Extracting price range:', priceRangeValue);
                if (typeof priceRangeValue === 'object' && priceRangeValue !== null) {
                    priceMin = priceRangeValue.min || 0;
                    priceMax = priceRangeValue.max || 0;
                } else if (typeof priceRangeValue === 'string' && priceRangeValue.trim() !== '') {
                    const prices = priceRangeValue.match(/(\d{1,3}(?:,\d{3})*)/g);
                    if (prices) {
                        priceMin = parseInt(prices[0].replace(/,/g, '')) || 0;
                        priceMax = prices[1] ? parseInt(prices[1].replace(/,/g, '')) || 0 : 0;
                    }
                }
                console.log('🏠 PropertySearchDataTransformer 💰 Extracted price range:', {
                    priceMin,
                    priceMax
                });
                return {
                    priceMin,
                    priceMax
                };
            };
            // Helper function to extract parking data
            const extractParkingData = (garageValue, garageCapacityValue) => {
                let parkingIndoor = "";
                let car = 0;
                console.log('🏠 PropertySearchDataTransformer 🚗 Extracting parking data:', {
                    garageValue,
                    garageCapacityValue
                });
                if (typeof garageValue === 'object' && garageValue !== null) {
                    if (garageValue.main === true || garageValue.main === 'yes') {
                        parkingIndoor = "Yes";
                        if (garageValue.yesValues && garageValue.yesValues.garageCapacity) {
                            car = extractNumericValue(garageValue.yesValues.garageCapacity);
                        }
                    } else if (garageValue.main === false || garageValue.main === 'no') {
                        parkingIndoor = "No";
                    }
                } else if (typeof garageValue === 'boolean') {
                    parkingIndoor = garageValue ? "Yes" : "No";
                    if (garageValue && garageCapacityValue) {
                        car = extractNumericValue(garageCapacityValue);
                    }
                } else if (typeof garageValue === 'string') {
                    if (garageValue.toLowerCase()
                        .includes('oui') || garageValue.toLowerCase()
                        .includes('yes')) {
                        parkingIndoor = "Yes";
                    } else if (garageValue.toLowerCase()
                        .includes('non') || garageValue.toLowerCase()
                        .includes('no')) {
                        parkingIndoor = "No";
                    }
                }
                console.log('🏠 PropertySearchDataTransformer 🚗 Extracted parking:', {
                    parkingIndoor,
                    car
                });
                return {
                    parkingIndoor,
                    car
                };
            };
            // Helper function to extract swimming pool
            const extractSwimmingPool = (poolValue) => {
                console.log('🏠 PropertySearchDataTransformer 🏊 Extracting swimming pool:', poolValue);
                if (typeof poolValue === 'boolean') {
                    return poolValue ? "Yes" : "No";
                } else if (typeof poolValue === 'string') {
                    if (poolValue.toLowerCase()
                        .includes('oui') || poolValue.toLowerCase()
                        .includes('yes')) {
                        return "Yes";
                    } else if (poolValue.toLowerCase()
                        .includes('non') || poolValue.toLowerCase()
                        .includes('no')) {
                        return "No";
                    }
                }
                return "";
            };
            // Extract and transform form data with better fallback handling
            criteria.cityName = extractArrayValues(originalFormValues.cities);
            criteria.category = extractArrayValues(originalFormValues.propertyCategories);
            criteria.houseType = extractArrayValues(originalFormValues.propertyTypes);
            criteria.bedrooms = extractNumericValue(originalFormValues.bedrooms);
            criteria.bathrooms = extractNumericValue(originalFormValues.bathrooms);
            const {
                priceMin,
                priceMax
            } = extractPriceRange(originalFormValues.priceRange);
            criteria.priceMin = priceMin;
            criteria.priceMax = priceMax;
            const {
                parkingIndoor,
                car
            } = extractParkingData(
                originalFormValues.garage,
                originalFormValues.garageCapacity
            );
            criteria.parkingIndoor = parkingIndoor;
            criteria.car = car;
            criteria.swimmingPool = extractSwimmingPool(originalFormValues.swimmingPool);
            console.log('🏠 PropertySearchDataTransformer: Extracted criteria:', criteria);
            return criteria;
        }
        /**
         * Generate Airtable formula from search criteria
         */
        generateAirtableFormula(criteria) {
            const conditions = [];
            // City filter
            if (criteria.cityName && criteria.cityName.length > 0) {
                const cityConditions = criteria.cityName.map((city) => `FIND("${city}", {City})`);
                const cityFormula = cityConditions.length === 1 ? cityConditions[0] : `OR(${cityConditions.join(", ")})`;
                conditions.push(cityFormula);
            }
            // Category filter
            if (criteria.category && criteria.category.length > 0) {
                const categoryConditions = criteria.category.map((cat) => `{Category} = "${cat}"`);
                const categoryFormula = categoryConditions.length === 1 ? categoryConditions[0] : `OR(${categoryConditions.join(", ")})`;
                conditions.push(categoryFormula);
            }
            // House Type filter
            if (criteria.houseType && criteria.houseType.length > 0) {
                const houseTypeConditions = criteria.houseType.map((ht) => `FIND("${ht}", {Type})`);
                const houseTypeFormula = houseTypeConditions.length === 1 ? houseTypeConditions[0] : `OR(${houseTypeConditions.join(", ")})`;
                conditions.push(houseTypeFormula);
            }
            // Bedrooms filter (only if not indifferent/0)
            if (criteria.bedrooms && criteria.bedrooms > 0) {
                conditions.push(`{Bedrooms} >= ${criteria.bedrooms}`);
            }
            // Bathrooms filter (only if not indifferent/0)
            if (criteria.bathrooms && criteria.bathrooms > 0) {
                conditions.push(`{Bathrooms} >= ${criteria.bathrooms}`);
            }
            // Price range
            if (criteria.priceMin && criteria.priceMin > 0) {
                conditions.push(`{Price} >= ${criteria.priceMin}`);
            }
            if (criteria.priceMax && criteria.priceMax > 0) {
                conditions.push(`{Price} <= ${criteria.priceMax}`);
            }
            // Parking
            if (criteria.parkingIndoor === "Yes") {
                conditions.push(`{IndoorParking} = "Yes"`);
            }
            if (criteria.car && criteria.car > 0) {
                conditions.push(`{CarIndoor} >= ${criteria.car}`);
            }
            // Swimming pool
            if (criteria.swimmingPool === "Yes") {
                conditions.push(`{SwimmingPool} = "Yes"`);
            }
            return conditions.length > 0 ? `AND(${conditions.join(", ")})` : "";
        }
        /**
         * Enhanced metadata generation
         */
        generateMetadata(originalFormValues, processedData, searchCriteria) {
            const baseMetadata = super.generateMetadata(originalFormValues, processedData);
            return {
                ...baseMetadata,
                searchType: 'property_search',
                airtableFilterGenerated: true,
                criteriaCount: Object.keys(searchCriteria)
                    .filter(key => {
                        const value = searchCriteria[key];
                        return value && value !== "" && value !== 0 && (!Array.isArray(value) || value.length > 0);
                    })
                    .length,
                hasLocationCriteria: !!(searchCriteria.cityName && searchCriteria.cityName.length > 0),
                hasPriceCriteria: !!(searchCriteria.priceMin > 0 || searchCriteria.priceMax > 0),
                hasFeatureCriteria: !!(searchCriteria.bedrooms > 0 || searchCriteria.bathrooms > 0 ||
                    searchCriteria.parkingIndoor || searchCriteria.swimmingPool)
            };
        }
        /**
         * Override submission type
         */
        getSubmissionType() {
            return "property_search";
        }
    },
    // ============================================================================
    // VOICEFLOW DATA TRANSFORMER - Integrates with new architecture
    // ============================================================================
    transformDataForVoiceflow: function (submissionData, originalFormValues) {
        console.log('🏠 PropertySearch 🔄 Transforming data for Voiceflow:', {
            submissionData,
            originalFormValues
        });
        // The submissionData now comes from PropertySearchDataTransformer
        // and already contains the processed data and Airtable formula
        if (submissionData.airtableFormula) {
            console.log('🏠 PropertySearch 🔍 Using generated Airtable formula:', submissionData.airtableFormula);
        }
        // Return the enhanced data for Voiceflow
        const transformedData = {
            type: "property_search",
            airtableFormula: submissionData.airtableFormula || "",
            searchCriteria: submissionData.searchCriteria || {},
            // Include processed sections for context
            sections: submissionData.sections || {},
            // Metadata
            language: submissionData.language || "fr",
            timestamp: submissionData.submissionTimestamp,
            hasResults: submissionData.hasValidCriteria || false,
            // Statistics
            criteriaCount: submissionData.metadata?.criteriaCount || 0,
            hasLocationCriteria: submissionData.metadata?.hasLocationCriteria || false,
            hasPriceCriteria: submissionData.metadata?.hasPriceCriteria || false,
            hasFeatureCriteria: submissionData.metadata?.hasFeatureCriteria || false,
            // Keep original data for debugging
            originalData: originalFormValues,
            transformerUsed: 'PropertySearchDataTransformer'
        };
        console.log('🏠 PropertySearch ✅ Final transformed data for Voiceflow:', transformedData);
        return transformedData;
    },
    // ============================================================================
    // FORM DATA CONFIGURATION - Complete options and translations
    // ============================================================================
    FORM_DATA: {
        options: {
            cities: [
                {
                    id: "North Shore",
                    name: {
                        fr: "Rive-Nord de Montréal",
                        en: "North Shore"
                    },
                    subcategories: [
                        {
                            id: "Blainville",
                            name: "Blainville"
                        },
                        {
                            id: "Boisbriand",
                            name: "Boisbriand"
                        },
                        {
                            id: "Bois-des-Filion",
                            name: "Bois-des-Filion"
                        },
                        {
                            id: "Charlemagne",
                            name: "Charlemagne"
                        },
                        {
                            id: "Chomedey",
                            name: "Chomedey"
                        },
                        {
                            id: "Deux-Montagnes",
                            name: "Deux-Montagnes"
                        },
                        {
                            id: "Fabreville",
                            name: "Fabreville"
                        },
                        {
                            id: "Gore",
                            name: "Gore"
                        },
                        {
                            id: "Kirkland",
                            name: "Kirkland"
                        },
                        {
                            id: "L'Assomption",
                            name: "L'Assomption"
                        },
                        {
                            id: "L'Épiphanie",
                            name: "L'Épiphanie"
                        },
                        {
                            id: "La Plaine",
                            name: "La Plaine"
                        },
                        {
                            id: "Lachenaie",
                            name: "Lachenaie"
                        },
                        {
                            id: "Lafontaine",
                            name: "Lafontaine"
                        },
                        {
                            id: "Lavaltrie",
                            name: "Lavaltrie"
                        },
                        {
                            id: "Laval",
                            name: "Laval"
                        },
                        {
                            id: "Lorraine",
                            name: "Lorraine"
                        },
                        {
                            id: "Le Gardeur",
                            name: "Le Gardeur"
                        },
                        {
                            id: "Mascouche",
                            name: "Mascouche"
                        },
                        {
                            id: "Mirabel",
                            name: "Mirabel"
                        },
                        {
                            id: "Oka",
                            name: "Oka"
                        },
                        {
                            id: "Pointe-Calumet",
                            name: "Pointe-Calumet"
                        },
                        {
                            id: "Repentigny",
                            name: "Repentigny"
                        },
                        {
                            id: "Rosemère",
                            name: "Rosemère"
                        },
                        {
                            id: "Saint-Colomban",
                            name: "Saint-Colomban"
                        },
                        {
                            id: "Saint-Eustache",
                            name: "Saint-Eustache"
                        },
                        {
                            id: "Saint-Jérôme",
                            name: "Saint-Jérôme"
                        },
                        {
                            id: "Saint-Joseph-du-Lac",
                            name: "Saint-Joseph-du-Lac"
                        },
                        {
                            id: "Saint-Lin/Laurentides",
                            name: "Saint-Lin/Laurentides"
                        },
                        {
                            id: "Saint-Placide",
                            name: "Saint-Placide"
                        },
                        {
                            id: "Saint-Sulpice",
                            name: "Saint-Sulpice"
                        },
                        {
                            id: "Sainte-Anne-des-Plaines",
                            name: "Sainte-Anne-des-Plaines"
                        },
                        {
                            id: "Sainte-Dorothée",
                            name: "Sainte-Dorothée"
                        },
                        {
                            id: "Sainte-Marthe-sur-le-Lac",
                            name: "Sainte-Marthe-sur-le-Lac"
                        },
                        {
                            id: "Sainte-Sophie",
                            name: "Sainte-Sophie"
                        },
                        {
                            id: "Sainte-Thérèse",
                            name: "Sainte-Thérèse"
                        },
                        {
                            id: "Terrebonne",
                            name: "Terrebonne"
                        }
                    ]
                },
                {
                    id: "Montreal",
                    name: {
                        fr: "Montréal",
                        en: "Montreal"
                    },
                    subcategories: [
                        {
                            id: "Ahuntsic-Cartierville",
                            name: "Ahuntsic-Cartierville"
                        },
                        {
                            id: "Anjou",
                            name: "Anjou"
                        },
                        {
                            id: "Baie-D'Urfé",
                            name: "Baie-D'Urfé"
                        },
                        {
                            id: "Beaconsfield",
                            name: "Beaconsfield"
                        },
                        {
                            id: "Côte-des-Neiges",
                            name: "Côte-des-Neiges"
                        },
                        {
                            id: "Côte-des-Neiges–Notre-Dame-de-Grâce",
                            name: "Côte-des-Neiges–Notre-Dame-de-Grâce"
                        },
                        {
                            id: "Côte-Saint-Luc",
                            name: "Côte-Saint-Luc"
                        },
                        {
                            id: "Dollard-des-Ormeaux",
                            name: "Dollard-des-Ormeaux"
                        },
                        {
                            id: "Dorval",
                            name: "Dorval"
                        },
                        {
                            id: "Hampstead",
                            name: "Hampstead"
                        },
                        {
                            id: "L'Île-Bizard",
                            name: "L'Île-Bizard"
                        },
                        {
                            id: "L'Île-Bizard–Sainte-Geneviève",
                            name: "L'Île-Bizard–Sainte-Geneviève"
                        },
                        {
                            id: "L'Île-Dorval",
                            name: "L'Île-Dorval"
                        },
                        {
                            id: "LaSalle",
                            name: "LaSalle"
                        },
                        {
                            id: "Lachine",
                            name: "Lachine"
                        },
                        {
                            id: "Le Plateau-Mont-Royal",
                            name: "Le Plateau-Mont-Royal"
                        },
                        {
                            id: "Le Sud-Ouest",
                            name: "Le Sud-Ouest"
                        },
                        {
                            id: "Mercier",
                            name: "Mercier"
                        },
                        {
                            id: "Hochelaga-Maisonneuve",
                            name: "Hochelaga-Maisonneuve"
                        },
                        {
                            id: "Mercier–Hochelaga-Maisonneuve",
                            name: "Mercier–Hochelaga-Maisonneuve"
                        },
                        {
                            id: "Mont-Royal",
                            name: "Mont-Royal"
                        },
                        {
                            id: "Montréal",
                            name: "Montréal"
                        },
                        {
                            id: "Montréal-Est",
                            name: "Montréal-Est"
                        },
                        {
                            id: "Montréal-Nord",
                            name: "Montréal-Nord"
                        },
                        {
                            id: "Montréal-Ouest",
                            name: "Montréal-Ouest"
                        },
                        {
                            id: "Notre-Dame-de-Grâce",
                            name: "Notre-Dame-de-Grâce"
                        },
                        {
                            id: "Outremont",
                            name: "Outremont"
                        },
                        {
                            id: "Pierrefonds-Roxboro",
                            name: "Pierrefonds-Roxboro"
                        },
                        {
                            id: "P.-a.-T.",
                            name: "P.-a.-T."
                        },
                        {
                            id: "Pointe-Claire",
                            name: "Pointe-Claire"
                        },
                        {
                            id: "R.-d.-P.",
                            name: "R.-d.-P."
                        },
                        {
                            id: "Rivière-des-Prairies",
                            name: "Rivière-des-Prairies"
                        },
                        {
                            id: "Pointe-aux-Trembles",
                            name: "Pointe-aux-Trembles"
                        },
                        {
                            id: "Rivière-des-Prairies–Pointe-aux-Trembles",
                            name: "Rivière-des-Prairies–Pointe-aux-Trembles"
                        },
                        {
                            id: "Rosemont–La Petite-Patrie",
                            name: "Rosemont–La Petite-Patrie"
                        },
                        {
                            id: "Rosemont",
                            name: "Rosemont"
                        },
                        {
                            id: "La Petite-Patrie",
                            name: "La Petite-Patrie"
                        },
                        {
                            id: "Sainte-Anne-de-Bellevue",
                            name: "Sainte-Anne-de-Bellevue"
                        },
                        {
                            id: "Saint-Laurent",
                            name: "Saint-Laurent"
                        },
                        {
                            id: "Saint-Léonard",
                            name: "Saint-Léonard"
                        },
                        {
                            id: "Sainte-Geneviève",
                            name: "Sainte-Geneviève"
                        },
                        {
                            id: "Senneville",
                            name: "Senneville"
                        },
                        {
                            id: "Verdun",
                            name: "Verdun"
                        },
                        {
                            id: "Île-des-Soeurs",
                            name: "Île-des-Soeurs"
                        },
                        {
                            id: "Ville-Marie",
                            name: "Ville-Marie"
                        },
                        {
                            id: "Westmount",
                            name: "Westmount"
                        },
                        {
                            id: "Villeray–Saint-Michel–Parc-Extension",
                            name: "Villeray–Saint-Michel–Parc-Extension"
                        },
                        {
                            id: "Villeray",
                            name: "Villeray"
                        },
                        {
                            id: "Saint-Michel",
                            name: "Saint-Michel"
                        },
                        {
                            id: "Parc-Extension",
                            name: "Parc-Extension"
                        }
                    ]
                },
                {
                    id: "South Shore",
                    name: {
                        fr: "Rive-Sud de Montréal",
                        en: "South Shore"
                    },
                    subcategories: [
                        {
                            id: "Beauharnois",
                            name: "Beauharnois"
                        },
                        {
                            id: "Beloeil",
                            name: "Beloeil"
                        },
                        {
                            id: "Boucherville",
                            name: "Boucherville"
                        },
                        {
                            id: "Brossard",
                            name: "Brossard"
                        },
                        {
                            id: "Candiac",
                            name: "Candiac"
                        },
                        {
                            id: "Carignan",
                            name: "Carignan"
                        },
                        {
                            id: "Chambly",
                            name: "Chambly"
                        },
                        {
                            id: "Châteauguay",
                            name: "Châteauguay"
                        },
                        {
                            id: "Contrecœur",
                            name: "Contrecœur"
                        },
                        {
                            id: "Delson",
                            name: "Delson"
                        },
                        {
                            id: "Greenfield Park",
                            name: "Greenfield Park"
                        },
                        {
                            id: "Henryville",
                            name: "Henryville"
                        },
                        {
                            id: "Howick",
                            name: "Howick"
                        },
                        {
                            id: "Kirkland",
                            name: "Kirkland"
                        },
                        {
                            id: "La Prairie",
                            name: "La Prairie"
                        },
                        {
                            id: "Lacolle",
                            name: "Lacolle"
                        },
                        {
                            id: "Le Vieux-Longueuil",
                            name: "Le Vieux-Longueuil"
                        },
                        {
                            id: "Lemoyne",
                            name: "Lemoyne"
                        },
                        {
                            id: "Léry",
                            name: "Léry"
                        },
                        {
                            id: "Longueuil",
                            name: "Longueuil"
                        },
                        {
                            id: "Marieville",
                            name: "Marieville"
                        },
                        {
                            id: "McMasterville",
                            name: "McMasterville"
                        },
                        {
                            id: "Mercier",
                            name: "Mercier"
                        },
                        {
                            id: "Mont-Saint-Hilaire",
                            name: "Mont-Saint-Hilaire"
                        },
                        {
                            id: "Montérégie",
                            name: "Montérégie"
                        },
                        {
                            id: "Napierville",
                            name: "Napierville"
                        },
                        {
                            id: "Otterburn Park",
                            name: "Otterburn Park"
                        },
                        {
                            id: "Richelieu",
                            name: "Richelieu"
                        },
                        {
                            id: "Rougemont",
                            name: "Rougemont"
                        },
                        {
                            id: "Saint-Amable",
                            name: "Saint-Amable"
                        },
                        {
                            id: "Saint-Basile-le-Grand",
                            name: "Saint-Basile-le-Grand"
                        },
                        {
                            id: "Saint-Blaise-sur-Richelieu",
                            name: "Saint-Blaise-sur-Richelieu"
                        },
                        {
                            id: "Saint-Bruno-de-Montarville",
                            name: "Saint-Bruno-de-Montarville"
                        },
                        {
                            id: "Saint-Constant",
                            name: "Saint-Constant"
                        },
                        {
                            id: "Saint-Étienne-de-Beauharnois",
                            name: "Saint-Étienne-de-Beauharnois"
                        },
                        {
                            id: "Saint-Hyacinthe",
                            name: "Saint-Hyacinthe"
                        },
                        {
                            id: "Saint-Hubert",
                            name: "Saint-Hubert"
                        },
                        {
                            id: "Saint-Isidore",
                            name: "Saint-Isidore"
                        },
                        {
                            id: "Saint-Jean-sur-Richelieu",
                            name: "Saint-Jean-sur-Richelieu"
                        },
                        {
                            id: "Saint-Lambert",
                            name: "Saint-Lambert"
                        },
                        {
                            id: "Saint-Marc-sur-Richelieu",
                            name: "Saint-Marc-sur-Richelieu"
                        },
                        {
                            id: "Saint-Mathias-sur-Richelieu",
                            name: "Saint-Mathias-sur-Richelieu"
                        },
                        {
                            id: "Saint-Mathieu",
                            name: "Saint-Mathieu"
                        },
                        {
                            id: "Saint-Mathieu-de-Beloeil",
                            name: "Saint-Mathieu-de-Beloeil"
                        },
                        {
                            id: "Saint-Michel",
                            name: "Saint-Michel"
                        },
                        {
                            id: "Saint-Philippe",
                            name: "Saint-Philippe"
                        },
                        {
                            id: "Saint-Rémi",
                            name: "Saint-Rémi"
                        },
                        {
                            id: "Sainte-Catherine",
                            name: "Sainte-Catherine"
                        },
                        {
                            id: "Sainte-Julie",
                            name: "Sainte-Julie"
                        },
                        {
                            id: "Sainte-Martine",
                            name: "Sainte-Martine"
                        },
                        {
                            id: "Salaberry-de-Valleyfield",
                            name: "Salaberry-de-Valleyfield"
                        },
                        {
                            id: "Sherrington",
                            name: "Sherrington"
                        },
                        {
                            id: "Varennes",
                            name: "Varennes"
                        },
                        {
                            id: "Verchères",
                            name: "Verchères"
                        }
                    ]
                }
            ],
            propertyCategories: [
                {
                    id: "Residential",
                    name: {
                        fr: "Résidentiel",
                        en: "Residential"
                    },
                    subcategories: [
                        {
                            id: "Maison",
                            name: {
                                fr: "Maison",
                                en: "House"
                            }
                        },
                        {
                            id: "Maison en copropriété",
                            name: {
                                fr: "Maison en copropriété",
                                en: "Co-ownership House"
                            }
                        },
                        {
                            id: "Intergénération",
                            name: {
                                fr: "Intergénération",
                                en: "Intergenerational"
                            }
                        },
                        {
                            id: "Maison mobile",
                            name: {
                                fr: "Maison mobile",
                                en: "Mobile House"
                            }
                        },
                        {
                            id: "Condo",
                            name: {
                                fr: "Condo",
                                en: "Condo"
                            }
                        },
                        {
                            id: "Loft / Studio",
                            name: {
                                fr: "Loft / Studio",
                                en: "Loft / Studio"
                            }
                        },
                        {
                            id: "Chalet",
                            name: {
                                fr: "Chalet",
                                en: "Cottage"
                            }
                        },
                        {
                            id: "Fermette",
                            name: {
                                fr: "Fermette",
                                en: "Farmhouse"
                            }
                        },
                        {
                            id: "Terrain",
                            name: {
                                fr: "Terrain",
                                en: "Land"
                            }
                        }
                    ]
                },
                {
                    id: "Plex",
                    name: {
                        fr: "Plex",
                        en: "Plex"
                    },
                    subcategories: [
                        {
                            id: "Duplex",
                            name: {
                                fr: "Duplex",
                                en: "Duplex"
                            }
                        },
                        {
                            id: "Triplex",
                            name: {
                                fr: "Triplex",
                                en: "Triplex"
                            }
                        },
                        {
                            id: "Quadruplex",
                            name: {
                                fr: "Quadruplex",
                                en: "Quadruplex"
                            }
                        },
                        {
                            id: "Quintuplex",
                            name: {
                                fr: "Quintuplex",
                                en: "Quintuplex"
                            }
                        },
                        {
                            id: "MultiPlex",
                            name: {
                                fr: "MultiPlex",
                                en: "MultiPlex"
                            }
                        }
                    ]
                }
            ],
            propertyTypes: [
                {
                    id: "À Paliers multiples",
                    name: {
                        fr: "À Paliers multiples",
                        en: "Multi-level"
                    }
                },
                {
                    id: "À étages",
                    name: {
                        fr: "À étages",
                        en: "Multi-storey"
                    }
                },
                {
                    id: "Détaché",
                    name: {
                        fr: "Détaché",
                        en: "Detached"
                    }
                },
                {
                    id: "Jumelé",
                    name: {
                        fr: "Jumelé",
                        en: "Semi-detached"
                    }
                },
                {
                    id: "En rangée",
                    name: {
                        fr: "En rangée",
                        en: "Row House"
                    }
                },
                {
                    id: "Divise",
                    name: {
                        fr: "Divise",
                        en: "Divided"
                    }
                },
                {
                    id: "Indivise",
                    name: {
                        fr: "Indivise",
                        en: "Undivided"
                    }
                },
                {
                    id: "Plain-pied",
                    name: {
                        fr: "Plain-pied",
                        en: "Single-storey"
                    }
                },
                {
                    id: "À un étage et demi",
                    name: {
                        fr: "À un étage et demi",
                        en: "One and a half storeys"
                    }
                }
            ]
        },
        translations: {
            fr: {
                nav: {
                    next: "Suivant",
                    previous: "Précédent",
                    submit: "Rechercher",
                    processing: "Recherche en cours..."
                },
                common: {
                    yes: "Oui",
                    no: "Non",
                    other: "Autre",
                    required: "requis",
                    fieldRequired: "Ce champ est requis",
                    edit: "Modifier",
                    notSpecified: "Non spécifié",
                    none: "Aucun",
                    any: "Indifférent"
                },
                steps: [
                    {
                        title: "Emplacement et Type",
                        desc: "Sélectionnez votre emplacement et type de propriété"
                    },
                    {
                        title: "Budget et Caractéristiques",
                        desc: "Définissez votre budget et spécifiez vos critères"
                    },
                    {
                        title: "Résumé",
                        desc: "Vérifiez vos critères de recherche"
                    }
                ],
                fields: {
                    cities: "Sélectionnez la ville",
                    propertyCategories: "Catégorie de propriété",
                    propertyTypes: "Type de propriété",
                    priceRange: "Fourchette de prix",
                    rooms: "Nombre de pièces",
                    bedrooms: "Chambres",
                    bathrooms: "Salles de bain",
                    garage: "Avez-vous besoin d'un garage ?",
                    garageCapacity: "Capacité du garage",
                    swimmingPool: "Avez-vous besoin d'une piscine ?"
                },
                errors: {
                    cities: "Veuillez sélectionner au moins une ville",
                    propertyCategories: "Veuillez sélectionner au moins une catégorie",
                    propertyTypes: "Veuillez sélectionner au moins un type",
                    priceRange: "Veuillez définir une fourchette de prix",
                    rooms: "Veuillez indiquer le nombre de pièces",
                    bedrooms: "Veuillez indiquer le nombre de chambres",
                    bathrooms: "Veuillez indiquer le nombre de salles de bain",
                    garage: "Veuillez indiquer si vous avez besoin d'un garage",
                    swimmingPool: "Veuillez indiquer si vous avez besoin d'une piscine",
                    selectAtLeastOne: "Veuillez sélectionner au moins une option"
                },
                success: {
                    title: "Recherche lancée !",
                    message: "Votre recherche de propriété a été soumise avec succès. Nos résultats correspondent à vos critères."
                },
                summary: {
                    title: "Vérifiez vos critères de recherche",
                    description: "Assurez-vous que vos critères correspondent à vos besoins avant de lancer la recherche.",
                    editStep: "Modifier",
                    location: "Emplacement",
                    propertyType: "Type de propriété",
                    priceRange: "Plage de prix",
                    features: "Caractéristiques",
                    anyLocation: "Tout emplacement",
                    anyType: "Tout type",
                    anyPrice: "Tout prix",
                    any: "Indifférent",
                    from: "À partir de",
                    upTo: "Jusqu'à",
                    roomsText: "pièces",
                    bedroomsText: "chambres",
                    bathroomsText: "salles de bain",
                    carsText: "voitures"
                }
            },
            en: {
                nav: {
                    next: "Next",
                    previous: "Previous",
                    submit: "Search",
                    processing: "Searching..."
                },
                common: {
                    yes: "Yes",
                    no: "No",
                    other: "Other",
                    required: "required",
                    fieldRequired: "This field is required",
                    edit: "Edit",
                    notSpecified: "Not specified",
                    none: "None",
                    any: "Any"
                },
                steps: [
                    {
                        title: "Location & Type",
                        desc: "Select your location and property type"
                    },
                    {
                        title: "Budget & Features",
                        desc: "Define your budget and specify your criteria"
                    },
                    {
                        title: "Summary",
                        desc: "Review your search criteria"
                    }
                ],
                fields: {
                    cities: "Select City",
                    propertyCategories: "Property Category",
                    propertyTypes: "Property Type",
                    priceRange: "Price Range",
                    rooms: "Rooms",
                    bedrooms: "Bedrooms",
                    bathrooms: "Bathrooms",
                    garage: "Do you need a garage?",
                    garageCapacity: "Garage Capacity",
                    swimmingPool: "Do you need a swimming pool?"
                },
                errors: {
                    cities: "Please select at least one city",
                    propertyCategories: "Please select at least one category",
                    propertyTypes: "Please select at least one type",
                    priceRange: "Please define a price range",
                    rooms: "Please specify the number of rooms",
                    bedrooms: "Please specify the number of bedrooms",
                    bathrooms: "Please specify the number of bathrooms",
                    garage: "Please indicate if you need a garage",
                    swimmingPool: "Please indicate if you need a swimming pool",
                    selectAtLeastOne: "Please select at least one option"
                },
                success: {
                    title: "Search Started!",
                    message: "Your property search has been submitted successfully. Our results match your criteria."
                },
                summary: {
                    title: "Review Your Search Criteria",
                    description: "Make sure your criteria match your needs before starting the search.",
                    editStep: "Edit",
                    location: "Location",
                    propertyType: "Property Type",
                    priceRange: "Price Range",
                    features: "Features",
                    anyLocation: "Any location",
                    anyType: "Any type",
                    anyPrice: "Any price",
                    any: "Any",
                    from: "From",
                    upTo: "Up to",
                    roomsText: "rooms",
                    bedroomsText: "bedrooms",
                    bathroomsText: "bathrooms",
                    carsText: "cars"
                }
            }
        }
    },
    // ============================================================================
    // FORM CONFIGURATION - Field definitions and step structure
    // ============================================================================
    FORM_CONFIG: {
        steps: [
            // Step 1: Location & Type
            {
                sectionId: "location_and_type", // NEW: Explicit section ID for generic processing
                fields: [
                    {
                        type: 'multiselect-subsections',
                        row: 'cities',
                        id: 'cities',
                        required: false,
                        subsectionOptions: 'cities',
                        customErrorMessages: {
                            selectAtLeastOne: 'Veuillez sélectionner au moins une ville'
                        }
                    },
                    {
                        type: 'multiselect-subsections',
                        row: 'propertyCategories',
                        id: 'propertyCategories',
                        required: false,
                        subsectionOptions: 'propertyCategories',
                        customErrorMessages: {
                            selectAtLeastOne: 'Veuillez sélectionner au moins une catégorie'
                        }
                    },
                    {
                        type: 'multiselect',
                        id: 'propertyTypes',
                        row: 'propertyTypes',
                        required: false,
                        options: 'propertyTypes',
                        customErrorMessages: {
                            selectAtLeastOne: 'Veuillez sélectionner au moins un type'
                        }
                    }
                ]
            },
            // Step 2: Budget & Features
            {
                sectionId: "budget_and_features", // NEW: Explicit section ID
                fields: [
                    {
                        type: 'sliding-window-range',
                        id: 'priceRange',
                        required: false,
                        min: 0,
                        max: 2000000,
                        step: 10000,
                        rangeWindow: 500000,
                        windowStep: 100000,
                        minGap: 50000,
                        defaultMin: 200000,
                        defaultMax: 400000,
                        formatValue: (val) => `${parseInt(val).toLocaleString()} $`,
                        customErrorMessage: 'Veuillez définir une fourchette de prix',
                        row: 'budget-rooms'
                    },
                    {
                        type: 'options-slider',
                        id: 'rooms',
                        required: false,
                        options: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => ({
                            value: num,
                            display: num === 0 ? "Indifférent" : num === 10 ? "10+ pièces" : `${num} pièce${num > 1 ? 's' : ''}`
                        })),
                        defaultIndex: 0,
                        showMarkers: true,
                        customErrorMessage: 'Veuillez indiquer le nombre de pièces',
                        row: 'budget-rooms'
                    },
                    {
                        type: 'options-slider',
                        id: 'bedrooms',
                        required: false,
                        options: [0, 1, 2, 3, 4, 5, 6].map(num => ({
                            value: num,
                            display: num === 0 ? "Indifférent" : num === 6 ? "6+ chambres" : `${num} chambre${num > 1 ? 's' : ''}`
                        })),
                        defaultIndex: 0,
                        showMarkers: true,
                        row: 'room-details',
                        customErrorMessage: 'Veuillez indiquer le nombre de chambres'
                    },
                    {
                        type: 'options-slider',
                        id: 'bathrooms',
                        required: false,
                        options: [0, 1, 2, 3, 4, 5].map(num => ({
                            value: num,
                            display: num === 0 ? "Indifférent" : num === 5 ? "5+ salles de bain" : `${num} salle${num > 1 ? 's' : ''} de bain`
                        })),
                        defaultIndex: 0,
                        showMarkers: true,
                        row: 'room-details',
                        customErrorMessage: 'Veuillez indiquer le nombre de salles de bain'
                    },
                    {
                        type: 'yesno-with-options',
                        id: 'garage',
                        required: false,
                        customErrorMessage: 'Veuillez indiquer si vous avez besoin d\'un garage',
                        yesField: {
                            type: 'options-slider',
                            id: 'garageCapacity',
                            required: false,
                            options: [1, 2, 3, 4, 5].map(num => ({
                                value: num,
                                display: num === 5 ? "5+ voitures" : `${num} voiture${num > 1 ? 's' : ''}`
                            })),
                            defaultIndex: 0,
                            showMarkers: true,
                            label: 'Capacité du garage'
                        }
                    },
                    {
                        type: 'yesno',
                        id: 'swimmingPool',
                        required: false,
                        customErrorMessage: 'Veuillez indiquer si vous avez besoin d\'une piscine'
                    }
                ]
            },
            // Step 3: Summary
            {
                sectionId: "search_summary", // NEW: Explicit section ID
                fields: [
                    {
                        type: 'custom',
                        id: 'summary',
                        name: 'summary',
                        autoSummary: true,
                        getSummaryData: true,
                        label: ''
                    }
                ]
            }
        ]
    }
};
// ============================================================================
// ENHANCED IMAGE GALLERY EXTENSION - FormFields Integration
// ============================================================================
const ImageExtension = {
    name: "OptimizedImageGallery",
    type: "response",
    match: ({
        trace
    }) => trace.type === "ext_image_extension" || trace.payload?.name === "ext_image_extension",
    containerElement: null,
    parseImageUrls(imageString) {
        if (!imageString || typeof imageString !== 'string') {
            return [];
        }
        return imageString
            .split(',')
            .map(url => url.trim())
            .filter(url => url !== '');
    },
    render: async ({
        trace,
        element
    }) => {
        let {
            language = "en",
                images = "",
                enableDetailedLogging = true,
                logPrefix = "🖼️ ImageGallery",
                cssUrls = CONFIG.DEFAULT_CSS,
                formType = "image_gallery",
                formStructure = "single",
                showSubmitButton = false,
                maxImages = 10,
                autoPlay = false,
                autoPlayInterval = 3000,
                showThumbnails = false,
                allowFullscreen = true,
                enableKeyboardNavigation = true
        } = trace.payload || {};
        ImageExtension.containerElement = element;
        const getTranslatedText = (key, lang = language) => {
            const keys = key.split('.');
            let value = ImageExtension.FORM_DATA.translations[lang];
            for (const k of keys) {
                value = value?.[k];
            }
            return value || key;
        };
        const imageUrls = ImageExtension.parseImageUrls(images);
        if (imageUrls.length === 0) {
            console.error('🖼️ ImageGallery: No valid images provided');
            const errorDiv = document.createElement('div');
            errorDiv.className = 'image-gallery-error';
            errorDiv.textContent = getTranslatedText('errors.noValidImages');
            element.appendChild(errorDiv);
            return;
        }
        const limitedImages = imageUrls.slice(0, maxImages);
        console.log(`🖼️ ImageGallery: Displaying ${limitedImages.length} images`);
        const extension = new CreatForm({
                language: language,
                formType: formType,
                formStructure: formStructure,
                webhookEnabled: false,
                webhookUrl: null,
                voiceflowEnabled: false,
                enableSessionTimeout: false,
                enableDetailedLogging: enableDetailedLogging,
                logPrefix: logPrefix,
                cssUrls: cssUrls,
                showSubmitButton: showSubmitButton
            },
            ImageExtension.FORM_DATA, {
                steps: [
                    {
                        sectionId: "image_gallery",
                        fields: [
                            {
                                type: 'image-gallery',
                                id: 'imageGallery',
                                name: 'imageGallery',
                                label: getTranslatedText('imageGallery.title'),
                                description: getTranslatedText('imageGallery.description'),
                                images: limitedImages,
                                autoPlay: autoPlay,
                                autoPlayInterval: autoPlayInterval,
                                showThumbnails: showThumbnails,
                                allowFullscreen: allowFullscreen,
                                enableKeyboardNavigation: enableKeyboardNavigation,
                                language: language
                                    }
                                ]
                            }
                        ]
            }, {
                DEFAULT_WEBHOOK: CONFIG.DEFAULT_WEBHOOK,
                DEFAULT_CSS: CONFIG.DEFAULT_CSS,
                SESSION_TIMEOUT: CONFIG.SESSION_TIMEOUT,
                SESSION_WARNING: CONFIG.SESSION_WARNING,
                DEBOUNCE_DELAY: CONFIG.DEBOUNCE_DELAY,
                FORM_VERSION: CONFIG.FORM_VERSION
            }
        );
        return await extension.render(element);
    },
    FORM_DATA: {
        options: {},
        translations: {
            fr: {
                imageGallery: {
                    title: "Galerie d'Images",
                    description: "Parcourez les images en utilisant les boutons de navigation ou les touches fléchées du clavier.",
                    previous: "Précédent",
                    next: "Suivant",
                    fullscreen: "Plein écran",
                    exitFullscreen: "Quitter le plein écran",
                    loadingError: "Erreur lors du chargement de l'image",
                    noImages: "Aucune image à afficher"
                },
                errors: {
                    noValidImages: "Aucune image valide fournie",
                    imageLoadFailed: "Échec du chargement de l'image"
                }
            },
            en: {
                imageGallery: {
                    title: "Image Gallery",
                    description: "Browse images using navigation buttons or keyboard arrow keys.",
                    previous: "Previous",
                    next: "Next",
                    fullscreen: "Fullscreen",
                    exitFullscreen: "Exit Fullscreen",
                    loadingError: "Error loading image",
                    noImages: "No images to display"
                },
                errors: {
                    noValidImages: "No valid images provided",
                    imageLoadFailed: "Failed to load image"
                }
            }
        }
    }
};
const LocalisationExtension = {
    name: 'Localisation',
    type: 'response',
    match: ({
            trace
        }) =>
        trace.type === 'ext_localisation' || trace.payload?.name === 'ext_localisation',
    render: ({
        trace,
        element
    }) => {
        const {
            language,
            key,
            LAT,
            LNG
        } = trace.payload;
        // Create the container element
        const container = document.createElement("div");
        // Determine container width based on device screen width
        const containerWidth = window.innerWidth <= 768 ? "300px" : "100%";
        container.style.cssText = `
          width: ${containerWidth};
          height: 450px;
          border: 1px solid #888;
          border-radius: 8px;
          overflow: hidden;
        `;
        element.appendChild(container);

        function loadSDKScript() {
            return new Promise((resolve, reject) => {
                if (document.querySelector('script[src="https://sdk.locallogic.co/sdks-js/1.13.2/index.umd.js"]')) {
                    resolve();
                    return;
                }
                const sdkScript = document.createElement('script');
                sdkScript.src = "https://sdk.locallogic.co/sdks-js/1.13.2/index.umd.js";
                sdkScript.async = true;
                sdkScript.onload = () => resolve();
                sdkScript.onerror = () =>
                    reject(new Error('Failed to load LocalLogic SDK script.'));
                document.body.appendChild(sdkScript);
            });
        }
        loadSDKScript()
            .then(() => {
                if (typeof LLSDKsJS === 'undefined') {
                    container.innerHTML = "LocalLogic SDK not available.";
                    return;
                }
                const ll = LLSDKsJS(key, {
                    locale: language,
                    appearance: {
                        theme: "day",
                        variables: {
                            "--ll-color-primary": "#003da5",
                            "--ll-color-primary-variant1": "#003da5",
                            "--ll-border-radius-small": "8px",
                            "--ll-border-radius-medium": "16px",
                            "--ll-font-family": "Avenir, sans-serif"
                        }
                    }
                });
                // Render the local content inside our container
                ll.create("local-content", container, {
                    lat: parseFloat(LAT),
                    lng: parseFloat(LNG),
                    cooperativeGestures: false,
                    marker: {
                        lat: parseFloat(LAT),
                        lng: parseFloat(LNG)
                    },
                    zoom: 20
                });
            })
            .catch(error => {
                container.innerHTML = "Error loading local content.";
                console.error(error);
            });
    }
};
// ============================================================================
// ENHANCED CALCULATOR FORM EXTENSION - REWRITTEN WITH GENERIC APPROACH
// ============================================================================
const CombinedCalculatorsExtension = {
    name: "OptimizedCombinedCalculators",
    type: "response",
    match: ({
        trace
    }) => trace.type === "ext_combined_calculators" || trace.payload?.name === "ext_combined_calculators",
    // Configuration (keep original structure for method access)
    config: {
        paymentFrequencies: {
            weekly: 52,
            biweekly: 26,
            monthly: 12
        },
        minDownPaymentPercentage: 0.05,
        maxDebtRatio: 0.32
    },
    // Memoization cache
    calculationCache: new Map(),
    // Container reference for Voiceflow compatibility
    containerElement: null,
    // Utility methods
    extractValue(value) {
        if (value == null) return 0;
        if (typeof value === 'number' && !isNaN(value)) return value;
        if (typeof value === 'object' && value !== null) {
            return value.selectedMin ?? value.min ?? value.value ?? 0;
        }
        const parsed = parseFloat(value);
        return isNaN(parsed) ? 0 : parsed;
    },
    formatCurrency(number) {
        if (number == null || isNaN(number)) return '$0';
        return new Intl.NumberFormat('en-CA', {
                style: 'currency',
                currency: 'CAD',
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
            })
            .format(Math.max(0, number))
            .replace(/,/g, ' ')
            .replace(/\u00A0/g, ' ');
    },
    getFrequencyDisplayText(frequency, language = 'en') {
        const frequencyMap = {
            'weekly': language === 'fr' ? 'semaine' : 'week',
            'biweekly': language === 'fr' ? '2semaines' : '2weeks',
            'monthly': language === 'fr' ? 'mois' : 'month'
        };
        return frequencyMap[frequency] || (language === 'fr' ? 'semaine' : 'week');
    },
    calculateBorrowingCapacity(values) {
        const cacheKey = `borrowing-${JSON.stringify(values)}`;
        if (this.calculationCache.has(cacheKey)) {
            return this.calculationCache.get(cacheKey);
        }
        try {
            const {
                annualIncome = 75000,
                    monthlyExpenses = 3000,
                    downPaymentAvailable = 25000,
                    interestRate = 2,
                    amortizationPeriod = 20,
                    paymentFrequency = 'biweekly'
            } = values;
            const paymentsPerYear = this.config.paymentFrequencies[paymentFrequency];
            const disposableAnnualIncome = Math.max(annualIncome - (monthlyExpenses * 12), 0);
            const maxPeriodicPayment = (disposableAnnualIncome / paymentsPerYear) * this.config.maxDebtRatio;
            const periodicRate = (interestRate / 100) / paymentsPerYear;
            const numberOfPayments = amortizationPeriod * paymentsPerYear;
            let maxLoanAmount = 0;
            if (periodicRate > 0) {
                maxLoanAmount = maxPeriodicPayment * ((1 - Math.pow(1 + periodicRate, -numberOfPayments)) / periodicRate);
            } else {
                maxLoanAmount = maxPeriodicPayment * numberOfPayments;
            }
            let actualPeriodicPayment = 0;
            if (periodicRate > 0 && maxLoanAmount > 0) {
                actualPeriodicPayment = (maxLoanAmount * periodicRate) / (1 - Math.pow(1 + periodicRate, -numberOfPayments));
            } else if (maxLoanAmount > 0) {
                actualPeriodicPayment = maxLoanAmount / numberOfPayments;
            }
            const result = {
                paymentPerPeriod: Math.max(0, actualPeriodicPayment),
                borrowingCapacity: Math.max(0, Math.round(maxLoanAmount + downPaymentAvailable)),
                paymentFrequency
            };
            this.calculationCache.set(cacheKey, result);
            return result;
        } catch (error) {
            console.error('Error in borrowing calculation:', error);
            return {
                paymentPerPeriod: 0,
                borrowingCapacity: 0,
                paymentFrequency: 'weekly'
            };
        }
    },
    calculateMortgagePayment(values) {
        const cacheKey = `mortgage-${JSON.stringify(values)}`;
        if (this.calculationCache.has(cacheKey)) {
            return this.calculationCache.get(cacheKey);
        }
        try {
            const {
                propertyValue = 500000,
                    downPayment = 25000,
                    interestRate = 5.9,
                    amortizationPeriod = 25,
                    paymentFrequency = 'biweekly'
            } = values;
            const loanAmount = Math.max(0, propertyValue - downPayment);
            const paymentsPerYear = this.config.paymentFrequencies[paymentFrequency];
            const periodicRate = (interestRate / 100) / paymentsPerYear;
            const numberOfPayments = amortizationPeriod * paymentsPerYear;
            let periodicPayment = 0;
            if (periodicRate > 0 && loanAmount > 0) {
                periodicPayment = (loanAmount * periodicRate) / (1 - Math.pow(1 + periodicRate, -numberOfPayments));
            } else if (loanAmount > 0) {
                periodicPayment = loanAmount / numberOfPayments;
            }
            const result = {
                loanAmount: Math.max(0, loanAmount),
                payment: Math.max(0, periodicPayment),
                paymentFrequency
            };
            this.calculationCache.set(cacheKey, result);
            return result;
        } catch (error) {
            console.error('Error in mortgage calculation:', error);
            return {
                loanAmount: 0,
                payment: 0,
                paymentFrequency: 'weekly'
            };
        }
    },
    createResultCard(title, resultFields, hint) {
        const resultRows = resultFields.map(field => `
            <div class="result-row">
                <span class="result-label">${field.label}:</span>
                <span class="result-value ${field.highlighted ? 'highlighted' : ''}" id="${field.id}">$0</span>
            </div>
        `)
            .join('');
        return `
            <div class="result-card">
                <div class="result-title">${title}</div>
                ${resultRows}
                <div class="result-hint">${hint}</div>
            </div>
        `;
    },
    clearCache() {
        this.calculationCache.clear();
    },
    render: async ({
        trace,
        element
    }) => {
        // ============================================================================
        // EXTRACT ALL PAYLOAD DATA INTO VARIABLES USING DESTRUCTURING
        // Following the improved pattern from SubmissionFormExtension
        // ============================================================================
        let {
            language = "en",
                propertyCost = 500000,
                vf,
                webhookEnabled = false, // Calculator doesn't need webhook
                webhookUrl = null,
                voiceflowEnabled = false, // Calculator doesn't need Voiceflow integration
                voiceflowDataTransformer = null,
                enableDetailedLogging = true,
                logPrefix = "🧮 Calculator",
                enableSessionTimeout = false, // Calculators don't need timeouts
                sessionTimeout = CONFIG.SESSION_TIMEOUT,
                sessionWarning = CONFIG.SESSION_WARNING,
                cssUrls = CONFIG.DEFAULT_CSS,
                formType = "calculator",
                formStructure = "single",
                useStructuredData = true,
                dataTransformer = BaseDataTransformer,
                showSubmitButton = false, // No submit button needed for calculator
                debounceDelay = CONFIG.DEBOUNCE_DELAY
        } = trace.payload || {};
        // Store container reference for Voiceflow compatibility
        CombinedCalculatorsExtension.containerElement = element;
        // Helper function to get translated text
        const getTranslatedText = (key, lang = language) => {
            const keys = key.split('.');
            let value = CombinedCalculatorsExtension.FORM_DATA.translations[lang];
            for (const k of keys) {
                value = value?.[k];
            }
            return value || key;
        };
        // Current values storage
        const calculatorValues = {
            borrowing: {
                annualIncome: 75000,
                monthlyExpenses: 3000,
                downPaymentAvailable: 25000,
                interestRate: 2,
                paymentFrequency: 'biweekly',
                amortizationPeriod: 20
            },
            mortgage: {
                propertyValue: propertyCost,
                downPayment: Math.max(propertyCost * CombinedCalculatorsExtension.config.minDownPaymentPercentage, 25000),
                interestRate: 5.9,
                paymentFrequency: 'biweekly',
                amortizationPeriod: 25
            }
        };
        // Debounced update functions with container-based queries
        const debounce = (func, delay) => {
            let timeoutId;
            return (...args) => {
                clearTimeout(timeoutId);
                timeoutId = setTimeout(() => func.apply(this, args), delay);
            };
        };
        // ============================================================================
        // VOICEFLOW COMPATIBLE: Using container-based queries instead of document.getElementById
        // ============================================================================
        const updateBorrowingDisplay = debounce(() => {
            const result = CombinedCalculatorsExtension.calculateBorrowingCapacity(calculatorValues.borrowing);
            // Use container-based queries for Voiceflow compatibility
            const container = CombinedCalculatorsExtension.containerElement;
            if (!container) return;
            const paymentEl = container.querySelector('#borrowing-payment-amount');
            const capacityEl = container.querySelector('#borrowing-capacity-amount');
            if (paymentEl) {
                const frequencyText = CombinedCalculatorsExtension.getFrequencyDisplayText(result.paymentFrequency, language);
                paymentEl.textContent = `${CombinedCalculatorsExtension.formatCurrency(result.paymentPerPeriod)}/${frequencyText}`;
            }
            if (capacityEl) {
                capacityEl.textContent = CombinedCalculatorsExtension.formatCurrency(result.borrowingCapacity);
            }
        }, debounceDelay);
        const updateMortgageDisplay = debounce(() => {
            const result = CombinedCalculatorsExtension.calculateMortgagePayment(calculatorValues.mortgage);
            // Use container-based queries for Voiceflow compatibility
            const container = CombinedCalculatorsExtension.containerElement;
            if (!container) return;
            const loanEl = container.querySelector('#mortgage-loan-amount');
            const paymentEl = container.querySelector('#mortgage-payment-amount');
            if (loanEl) loanEl.textContent = CombinedCalculatorsExtension.formatCurrency(result.loanAmount);
            if (paymentEl) {
                const frequencyText = CombinedCalculatorsExtension.getFrequencyDisplayText(result.paymentFrequency, language);
                paymentEl.textContent = `${CombinedCalculatorsExtension.formatCurrency(result.payment)}/${frequencyText}`;
            }
        }, debounceDelay);
        // Field change handler
        const handleFieldChange = (tabId, fieldName, value, tabManager) => {
            let extractedValue = fieldName === 'paymentFrequency' ? value : CombinedCalculatorsExtension.extractValue(value);
            // Handle special validation for mortgage
            if (tabId === 'mortgage') {
                if (fieldName === 'propertyValue') {
                    const minDownPayment = extractedValue * CombinedCalculatorsExtension.config.minDownPaymentPercentage;
                    const currentDownPayment = calculatorValues.mortgage.downPayment;
                    if (currentDownPayment < minDownPayment) {
                        // Show error message for down payment field
                        setTimeout(() => {
                            const downPaymentField = tabManager?.getField?.('mortgage', 'downPayment');
                            if (downPaymentField) {
                                // Show error message
                                const errorMessage = getTranslatedText('errors.downPaymentTooLow')
                                    .replace('{minAmount}', CombinedCalculatorsExtension.formatCurrency(minDownPayment))
                                    .replace('{percentage}', '5%');
                                downPaymentField.showError(errorMessage);
                                // Update minimum value and current value
                                if (downPaymentField.updateMinValue) {
                                    downPaymentField.updateMinValue(minDownPayment);
                                }
                                downPaymentField.setValue(minDownPayment);
                                calculatorValues.mortgage.downPayment = minDownPayment;
                                // Hide error after 3 seconds
                                setTimeout(() => {
                                    if (downPaymentField.hideError) {
                                        downPaymentField.hideError();
                                    }
                                }, 3000);
                            }
                        }, 100);
                    }
                } else if (fieldName === 'downPayment') {
                    const minDownPayment = calculatorValues.mortgage.propertyValue * CombinedCalculatorsExtension.config.minDownPaymentPercentage;
                    if (extractedValue < minDownPayment) {
                        // Show error and adjust value
                        setTimeout(() => {
                            const downPaymentField = tabManager?.getField?.('mortgage', 'downPayment');
                            if (downPaymentField) {
                                const errorMessage = getTranslatedText('errors.downPaymentTooLow')
                                    .replace('{minAmount}', CombinedCalculatorsExtension.formatCurrency(minDownPayment))
                                    .replace('{percentage}', '5%');
                                downPaymentField.showError(errorMessage);
                                // Auto-correct the value
                                extractedValue = minDownPayment;
                                downPaymentField.setValue(minDownPayment);
                                // Hide error after 3 seconds
                                setTimeout(() => {
                                    if (downPaymentField.hideError) {
                                        downPaymentField.hideError();
                                    }
                                }, 3000);
                            }
                        }, 100);
                    }
                }
            }
            calculatorValues[tabId][fieldName] = extractedValue;
            if (tabId === 'borrowing') {
                updateBorrowingDisplay();
            } else {
                updateMortgageDisplay();
            }
        };
        // ============================================================================
        // NEW ARCHITECTURE: Using generic approach with extracted variables
        // Following the same pattern as SubmissionFormExtension
        // ============================================================================
        // Create the form with the new generic architecture using extracted variables
        const extension = new CreatForm({
                language: language,
                formType: formType,
                formStructure: formStructure,
                // ============================================================================
                // NEW: Generic approach - no specific field transformers needed!
                // BaseDataTransformer + FormDataProcessor handle everything automatically
                // ============================================================================
                useStructuredData: useStructuredData,
                dataTransformer: dataTransformer, // Generic transformer works with any form!
                // DISABLED: Webhook integration (not needed for calculator)
                webhookEnabled: webhookEnabled,
                webhookUrl: webhookUrl,
                // DISABLED: Voiceflow integration (not needed for calculator)
                voiceflowEnabled: voiceflowEnabled,
                voiceflowDataTransformer: voiceflowDataTransformer,
                // Enhanced logging using extracted variables
                enableDetailedLogging: enableDetailedLogging,
                logPrefix: logPrefix,
                // Session management using extracted variables
                enableSessionTimeout: enableSessionTimeout,
                sessionTimeout: sessionTimeout,
                sessionWarning: sessionWarning,
                // CSS configuration using extracted variables
                cssUrls: cssUrls,
                // Calculator specific using extracted variables
                showSubmitButton: showSubmitButton
            },
            CombinedCalculatorsExtension.FORM_DATA, {
                steps: [
                    {
                        sectionId: "calculator_tabs", // NEW: Explicit section ID for generic processing
                        fields: [
                            {
                                type: 'tab-manager',
                                id: 'calculator-tabs',
                                name: 'calculatorTabs',
                                label: '',
                                tabs: [
                                    {
                                        id: 'borrowing',
                                        label: getTranslatedText('borrowingTab'),
                                        customContent: (container, tabManager) => {
                                            // Create fields
                                            const fields = [
                                                {
                                                    type: 'sliding-window',
                                                    id: 'annualIncome',
                                                    name: 'annualIncome',
                                                    label: getTranslatedText('annualIncome'),
                                                    min: 20000,
                                                    max: 1000000,
                                                    rangeWindow: 100000,
                                                    windowStep: 100000,
                                                    step: 1000,
                                                    defaultValue: calculatorValues.borrowing.annualIncome,
                                                    formatValue: val => CombinedCalculatorsExtension.formatCurrency(val)
                                                },
                                                {
                                                    type: 'sliding-window',
                                                    id: 'monthlyExpenses',
                                                    name: 'monthlyExpenses',
                                                    label: getTranslatedText('monthlyExpenses'),
                                                    min: 500,
                                                    max: 50000,
                                                    rangeWindow: 5000,
                                                    windowStep: 5000,
                                                    step: 100,
                                                    defaultValue: calculatorValues.borrowing.monthlyExpenses,
                                                    formatValue: val => CombinedCalculatorsExtension.formatCurrency(val)
                                                },
                                                {
                                                    type: 'sliding-window',
                                                    id: 'downPaymentAvailable',
                                                    name: 'downPaymentAvailable',
                                                    label: getTranslatedText('downPaymentAvailable'),
                                                    min: 5000,
                                                    max: 500000,
                                                    rangeWindow: 50000,
                                                    windowStep: 25000,
                                                    step: 1000,
                                                    defaultValue: calculatorValues.borrowing.downPaymentAvailable,
                                                    formatValue: val => CombinedCalculatorsExtension.formatCurrency(val)
                                                },
                                                {
                                                    type: 'slider',
                                                    id: 'interestRate',
                                                    name: 'interestRate',
                                                    label: getTranslatedText('interestRate'),
                                                    value: calculatorValues.borrowing.interestRate,
                                                    min: 1.0,
                                                    max: 15.0,
                                                    step: 0.05,
                                                    sliderType: 'percentage',
                                                    formatValue: val => `${parseFloat(val).toFixed(2)}%`
                                                },
                                                {
                                                    type: 'options-slider',
                                                    id: 'amortizationPeriod',
                                                    name: 'amortizationPeriod',
                                                    label: getTranslatedText('amortizationPeriod'),
                                                    options: [5, 10, 15, 20, 25, 30].map(years => ({
                                                        value: years,
                                                        display: `${years} ${getTranslatedText('years')}`
                                                    })),
                                                    defaultIndex: 3,
                                                    showMarkers: true
                                                },
                                                {
                                                    type: 'options-slider',
                                                    id: 'paymentFrequency',
                                                    name: 'paymentFrequency',
                                                    label: getTranslatedText('paymentFrequency'),
                                                    options: ['weekly', 'biweekly', 'monthly'].map(freq => ({
                                                        value: freq,
                                                        display: getTranslatedText(freq)
                                                    })),
                                                    defaultIndex: 1,
                                                    showMarkers: true
                                                }
                                            ];
                                            // Create field instances with proper row layout
                                            const fieldInstances = [];
                                            // Organize into rows (2 fields per row)
                                            for (let i = 0; i < fields.length; i += 2) {
                                                const rowFields = fields.slice(i, i + 2);
                                                const row = document.createElement('div');
                                                row.className = 'field-row';
                                                rowFields.forEach(fieldConfig => {
                                                    const col = document.createElement('div');
                                                    col.className = 'field-col';
                                                    const enhancedConfig = {
                                                        ...fieldConfig,
                                                        id: `borrowing-${fieldConfig.id}`,
                                                        onChange: (value) => {
                                                            handleFieldChange('borrowing', fieldConfig.name || fieldConfig.id, value, tabManager);
                                                        }
                                                    };
                                                    const field = tabManager.factory.createField(enhancedConfig);
                                                    if (field) {
                                                        fieldInstances.push(field);
                                                        col.appendChild(field.render());
                                                    }
                                                    row.appendChild(col);
                                                });
                                                container.appendChild(row);
                                            }
                                            // Add results container
                                            const resultsContainer = document.createElement('div');
                                            resultsContainer.className = 'results-container';
                                            resultsContainer.innerHTML = CombinedCalculatorsExtension.createResultCard(
                                                getTranslatedText('borrowingCapacity'),
                                                [
                                                    {
                                                        label: getTranslatedText('estimatedPayment'),
                                                        id: 'borrowing-payment-amount',
                                                        highlighted: false
                                                    },
                                                    {
                                                        label: getTranslatedText('borrowingCapacity'),
                                                        id: 'borrowing-capacity-amount',
                                                        highlighted: true
                                                    }
                                                ],
                                                getTranslatedText('capacityHint')
                                            );
                                            container.appendChild(resultsContainer);
                                            // Store field instances for this tab
                                            tabManager.tabFieldInstances.set('borrowing', fieldInstances);
                                            // Set initial values and update display
                                            setTimeout(() => {
                                                fieldInstances.forEach((field, index) => {
                                                    const fieldConfig = fields[index];
                                                    const fieldName = fieldConfig.name || fieldConfig.id;
                                                    const value = calculatorValues.borrowing[fieldName];
                                                    if (value !== undefined) {
                                                        field.setValue(value);
                                                    }
                                                });
                                                updateBorrowingDisplay();
                                            }, 100);
                                        },
                                        onActivate: () => {
                                            setTimeout(() => updateBorrowingDisplay(), 100);
                                        }
                                    },
                                    {
                                        id: 'mortgage',
                                        label: getTranslatedText('mortgageTab'),
                                        customContent: (container, tabManager) => {
                                            // Create fields
                                            const fields = [
                                                {
                                                    type: 'sliding-window',
                                                    id: 'propertyValue',
                                                    name: 'propertyValue',
                                                    label: getTranslatedText('propertyValue'),
                                                    min: 100000,
                                                    max: 5000000,
                                                    rangeWindow: 1000000,
                                                    windowStep: 1000000,
                                                    step: 5000,
                                                    defaultValue: calculatorValues.mortgage.propertyValue,
                                                    formatValue: val => CombinedCalculatorsExtension.formatCurrency(val)
                                                },
                                                {
                                                    type: 'sliding-window',
                                                    id: 'downPayment',
                                                    name: 'downPayment',
                                                    label: getTranslatedText('downPayment'),
                                                    min: calculatorValues.mortgage.propertyValue * CONFIG.MIN_DOWN_PAYMENT_PERCENTAGE,
                                                    max: 1000000,
                                                    rangeWindow: Math.max(100000, calculatorValues.mortgage.propertyValue * 0.2),
                                                    windowStep: Math.max(25000, calculatorValues.mortgage.propertyValue * CONFIG.MIN_DOWN_PAYMENT_PERCENTAGE),
                                                    step: 1000,
                                                    defaultValue: calculatorValues.mortgage.downPayment,
                                                    formatValue: val => CombinedCalculatorsExtension.formatCurrency(val),
                                                    getCustomErrorMessage: (lang) => getTranslatedText('errors.downPaymentTooLow'),
                                                    allowValidation: true,
                                                    showErrorOnInvalid: true
                                                },
                                                {
                                                    type: 'slider',
                                                    id: 'interestRate',
                                                    name: 'interestRate',
                                                    label: getTranslatedText('interestRate'),
                                                    value: calculatorValues.mortgage.interestRate,
                                                    min: 1.0,
                                                    max: 15.0,
                                                    step: 0.05,
                                                    sliderType: 'percentage',
                                                    formatValue: val => `${parseFloat(val).toFixed(2)}%`
                                                },
                                                {
                                                    type: 'options-slider',
                                                    id: 'amortizationPeriod',
                                                    name: 'amortizationPeriod',
                                                    label: getTranslatedText('amortizationPeriod'),
                                                    options: [5, 10, 15, 20, 25, 30].map(years => ({
                                                        value: years,
                                                        display: `${years} ${getTranslatedText('years')}`
                                                    })),
                                                    defaultIndex: 4,
                                                    showMarkers: true
                                                },
                                                {
                                                    type: 'options-slider',
                                                    id: 'paymentFrequency',
                                                    name: 'paymentFrequency',
                                                    label: getTranslatedText('paymentFrequency'),
                                                    options: ['weekly', 'biweekly', 'monthly'].map(freq => ({
                                                        value: freq,
                                                        display: getTranslatedText(freq)
                                                    })),
                                                    defaultIndex: 1,
                                                    showMarkers: true
                                                }
                                            ];
                                            // Create field instances with proper row layout
                                            const fieldInstances = [];
                                            // Organize into rows (2 fields per row)
                                            for (let i = 0; i < fields.length; i += 2) {
                                                const rowFields = fields.slice(i, i + 2);
                                                const row = document.createElement('div');
                                                row.className = 'field-row';
                                                rowFields.forEach(fieldConfig => {
                                                    const col = document.createElement('div');
                                                    col.className = 'field-col';
                                                    const enhancedConfig = {
                                                        ...fieldConfig,
                                                        id: `mortgage-${fieldConfig.id}`,
                                                        onChange: (value) => {
                                                            handleFieldChange('mortgage', fieldConfig.name || fieldConfig.id, value, tabManager);
                                                        }
                                                    };
                                                    const field = tabManager.factory.createField(enhancedConfig);
                                                    if (field) {
                                                        fieldInstances.push(field);
                                                        col.appendChild(field.render());
                                                    }
                                                    row.appendChild(col);
                                                });
                                                container.appendChild(row);
                                            }
                                            // Add results container
                                            const resultsContainer = document.createElement('div');
                                            resultsContainer.className = 'results-container';
                                            resultsContainer.innerHTML = CombinedCalculatorsExtension.createResultCard(
                                                getTranslatedText('mortgagePayment'),
                                                [
                                                    {
                                                        label: getTranslatedText('loanAmount'),
                                                        id: 'mortgage-loan-amount',
                                                        highlighted: false
                                                    },
                                                    {
                                                        label: getTranslatedText('mortgagePayment'),
                                                        id: 'mortgage-payment-amount',
                                                        highlighted: true
                                                    }
                                                ],
                                                getTranslatedText('mortgageHint')
                                            );
                                            container.appendChild(resultsContainer);
                                            // Store field instances for this tab
                                            tabManager.tabFieldInstances.set('mortgage', fieldInstances);
                                            // Set initial values and update display
                                            setTimeout(() => {
                                                fieldInstances.forEach((field, index) => {
                                                    const fieldConfig = fields[index];
                                                    const fieldName = fieldConfig.name || fieldConfig.id;
                                                    const value = calculatorValues.mortgage[fieldName];
                                                    if (value !== undefined) {
                                                        field.setValue(value);
                                                    }
                                                });
                                                updateMortgageDisplay();
                                            }, 100);
                                        },
                                        onActivate: () => {
                                            setTimeout(() => updateMortgageDisplay(), 100);
                                        }
                                    }
                                ],
                                activeTabId: 'borrowing',
                                tabStyle: 'default',
                                onTabChange: (newTabId, previousTabId, tabManager) => {
                                    console.log(`🧮 Calculator: Switched from ${previousTabId} to ${newTabId}`);
                                }
                            }
                        ]
                    }
                ]
            }, {
                DEFAULT_WEBHOOK: CONFIG.DEFAULT_WEBHOOK,
                DEFAULT_CSS: CONFIG.DEFAULT_CSS,
                SESSION_TIMEOUT: CONFIG.SESSION_TIMEOUT,
                SESSION_WARNING: CONFIG.SESSION_WARNING,
                DEBOUNCE_DELAY: CONFIG.DEBOUNCE_DELAY,
                FORM_VERSION: CONFIG.FORM_VERSION
            }
        );
        return await extension.render(element);
    },
    // ============================================================================
    // FORM DATA CONFIGURATION - Complete options and translations
    // ============================================================================
    FORM_DATA: {
        options: {
            paymentFrequencies: [
                {
                    id: "weekly",
                    name: {
                        fr: "Hebdomadaire",
                        en: "Weekly"
                    }
                },
                {
                    id: "biweekly",
                    name: {
                        fr: "Aux 2 semaines",
                        en: "Bi-weekly"
                    }
                },
                {
                    id: "monthly",
                    name: {
                        fr: "Mensuelle",
                        en: "Monthly"
                    }
                }
            ],
            amortizationPeriods: [
                {
                    id: 5,
                    name: {
                        fr: "5 ans",
                        en: "5 years"
                    }
                },
                {
                    id: 10,
                    name: {
                        fr: "10 ans",
                        en: "10 years"
                    }
                },
                {
                    id: 15,
                    name: {
                        fr: "15 ans",
                        en: "15 years"
                    }
                },
                {
                    id: 20,
                    name: {
                        fr: "20 ans",
                        en: "20 years"
                    }
                },
                {
                    id: 25,
                    name: {
                        fr: "25 ans",
                        en: "25 years"
                    }
                },
                {
                    id: 30,
                    name: {
                        fr: "30 ans",
                        en: "30 years"
                    }
                }
            ]
        },
        translations: {
            fr: {
                calculatorTitle: "Calculatrices Hypothécaires",
                calculatorDescription: "Utilisez nos calculatrices pour estimer votre capacité d'emprunt et vos paiements hypothécaires.",
                borrowingTab: "Capacité d'Emprunt",
                mortgageTab: "Paiement Hypothécaire",
                annualIncome: "Revenu annuel brut",
                monthlyExpenses: "Dépenses mensuelles",
                downPaymentAvailable: "Mise de fonds disponible",
                interestRate: "Taux d'intérêt",
                paymentFrequency: "Fréquence des versements",
                amortizationPeriod: "Période d'amortissement",
                propertyValue: "Coût de la propriété",
                downPayment: "Mise de fonds",
                weekly: "Hebdomadaire",
                biweekly: "Aux 2 semaines",
                monthly: "Mensuelle",
                years: "ans",
                borrowingCapacity: "Votre Capacité d'Emprunt Estimée",
                estimatedPayment: "Montant de Paiement Estimé",
                loanAmount: "Montant du prêt",
                mortgagePayment: "Paiement hypothécaire",
                capacityHint: "Capacité totale d'emprunt incluant la mise de fonds disponible",
                mortgageHint: "Paiement estimé basé sur les conditions sélectionnées",
                errors: {
                    downPaymentTooLow: "La mise de fonds doit être d'au moins {percentage} de la valeur de la propriété ({minAmount}). La valeur a été ajustée automatiquement."
                }
            },
            en: {
                calculatorTitle: "Mortgage Calculators",
                calculatorDescription: "Use our calculators to estimate your borrowing capacity and mortgage payments.",
                borrowingTab: "Borrowing Capacity",
                mortgageTab: "Mortgage Payment",
                annualIncome: "Annual Gross Income",
                monthlyExpenses: "Monthly Expenses",
                downPaymentAvailable: "Down Payment Available",
                interestRate: "Interest Rate",
                paymentFrequency: "Payment Frequency",
                amortizationPeriod: "Amortization Period",
                propertyValue: "Property Value",
                downPayment: "Down Payment",
                weekly: "Weekly",
                biweekly: "Bi-weekly",
                monthly: "Monthly",
                years: "years",
                borrowingCapacity: "Your Estimated Borrowing Capacity",
                estimatedPayment: "Estimated Payment Amount",
                loanAmount: "Loan Amount",
                mortgagePayment: "Mortgage Payment",
                capacityHint: "Total borrowing capacity including available down payment",
                mortgageHint: "Estimated payment based on selected terms",
                errors: {
                    downPaymentTooLow: "Down payment must be at least {percentage} of property value ({minAmount}). Value has been automatically adjusted."
                }
            }
        }
    }
};
const PropertySellFormExtension = {
    name: "PropertySellForm",
    type: "response",
    match: ({
        trace
    }) => trace.type === "ext_sell_property_form" || trace.payload?.name === "ext_sell_property_form",
    render: async ({
        trace,
        element
    }) => {
        // ============================================================================
        // EXTRACT ALL PAYLOAD DATA INTO VARIABLES USING DESTRUCTURING
        // Following the improved pattern from SubmissionFormExtension
        // ============================================================================
        let {
            language = "fr",
                vf,
                webhookEnabled = true,
                webhookUrl = CONFIG.DEFAULT_WEBHOOK,
                voiceflowEnabled = true,
                voiceflowDataTransformer = null,
                enableDetailedLogging = true,
                logPrefix = "🏠 PropertySellForm",
                enableSessionTimeout = true,
                sessionTimeout = CONFIG.SESSION_TIMEOUT,
                sessionWarning = CONFIG.SESSION_WARNING,
                cssUrls = CONFIG.DEFAULT_CSS,
                formType = "property_sell",
                formStructure = "multistep",
                useStructuredData = true,
                dataTransformer = BaseDataTransformer
        } = trace.payload || {};
        // Helper function to get translated text
        const getTranslatedText = (key, lang = language) => {
            const keys = key.split('.');
            let value = PropertySellFormExtension.FORM_DATA.translations[lang];
            for (const k of keys) {
                value = value?.[k];
            }
            return value || key;
        };
        // ============================================================================
        // DRAMATICALLY SIMPLIFIED: No more specific field transformers!
        // Uses generic FormDataProcessor and BaseDataTransformer
        // Following the same pattern as SubmissionFormExtension
        // ============================================================================
        // Create the form with the new generic architecture using extracted variables
        const extension = new CreatForm({
                language: language,
                formType: formType,
                formStructure: formStructure,
                // ============================================================================
                // NEW: Generic approach - no specific field transformers needed!
                // BaseDataTransformer + FormDataProcessor handle everything automatically
                // ============================================================================
                useStructuredData: useStructuredData,
                dataTransformer: dataTransformer, // Generic transformer works with any form!
                // ENABLED: Webhook integration using extracted variables
                webhookEnabled: webhookEnabled,
                webhookUrl: webhookUrl,
                // ENABLED: Voiceflow integration with optional custom transformer
                voiceflowEnabled: voiceflowEnabled,
                voiceflowDataTransformer: voiceflowDataTransformer,
                // Enhanced logging using extracted variables
                enableDetailedLogging: enableDetailedLogging,
                logPrefix: logPrefix,
                // Session management using extracted variables
                enableSessionTimeout: enableSessionTimeout,
                sessionTimeout: sessionTimeout,
                sessionWarning: sessionWarning,
                // CSS configuration using extracted variables
                cssUrls: cssUrls
            },
            PropertySellFormExtension.FORM_DATA,
            PropertySellFormExtension.FORM_CONFIG
        );
        return await extension.render(element);
    },
    // ============================================================================
    // FORM DATA CONFIGURATION - Complete options and translations
    // ============================================================================
    FORM_DATA: {
        options: {
            propertyCategories: [
                {
                    id: "Residential",
                    name: {
                        fr: "Résidentiel",
                        en: "Residential"
                    },
                    subcategories: [
                        {
                            id: "Maison",
                            name: {
                                fr: "Maison",
                                en: "House"
                            }
                        },
                        {
                            id: "Maison en copropriété",
                            name: {
                                fr: "Maison en copropriété",
                                en: "Co-ownership House"
                            }
                        },
                        {
                            id: "Intergénération",
                            name: {
                                fr: "Intergénération",
                                en: "Intergenerational"
                            }
                        },
                        {
                            id: "Maison mobile",
                            name: {
                                fr: "Maison mobile",
                                en: "Mobile House"
                            }
                        },
                        {
                            id: "Condo",
                            name: {
                                fr: "Condo",
                                en: "Condo"
                            }
                        },
                        {
                            id: "Loft / Studio",
                            name: {
                                fr: "Loft / Studio",
                                en: "Loft / Studio"
                            }
                        },
                        {
                            id: "Chalet",
                            name: {
                                fr: "Chalet",
                                en: "Cottage"
                            }
                        },
                        {
                            id: "Fermette",
                            name: {
                                fr: "Fermette",
                                en: "Farmhouse"
                            }
                        },
                        {
                            id: "Terrain",
                            name: {
                                fr: "Terrain",
                                en: "Land"
                            }
                        }
                    ]
                },
                {
                    id: "Plex",
                    name: {
                        fr: "Plex",
                        en: "Plex"
                    },
                    subcategories: [
                        {
                            id: "Duplex",
                            name: {
                                fr: "Duplex",
                                en: "Duplex"
                            }
                        },
                        {
                            id: "Triplex",
                            name: {
                                fr: "Triplex",
                                en: "Triplex"
                            }
                        },
                        {
                            id: "Quadruplex",
                            name: {
                                fr: "Quadruplex",
                                en: "Quadruplex"
                            }
                        },
                        {
                            id: "Quintuplex",
                            name: {
                                fr: "Quintuplex",
                                en: "Quintuplex"
                            }
                        },
                        {
                            id: "MultiPlex",
                            name: {
                                fr: "MultiPlex",
                                en: "MultiPlex"
                            }
                        }
                    ]
                }
            ],
            propertyTypes: [
                {
                    id: "À Paliers multiples",
                    name: {
                        fr: "À Paliers multiples",
                        en: "Multi-level"
                    }
                },
                {
                    id: "À étages",
                    name: {
                        fr: "À étages",
                        en: "Multi-storey"
                    }
                },
                {
                    id: "Détaché",
                    name: {
                        fr: "Détaché",
                        en: "Detached"
                    }
                },
                {
                    id: "Jumelé",
                    name: {
                        fr: "Jumelé",
                        en: "Semi-detached"
                    }
                },
                {
                    id: "En rangée",
                    name: {
                        fr: "En rangée",
                        en: "Row House"
                    }
                },
                {
                    id: "Divise",
                    name: {
                        fr: "Divise",
                        en: "Divided"
                    }
                },
                {
                    id: "Indivise",
                    name: {
                        fr: "Indivise",
                        en: "Undivided"
                    }
                },
                {
                    id: "Plain-pied",
                    name: {
                        fr: "Plain-pied",
                        en: "Single-storey"
                    }
                },
                {
                    id: "À un étage et demi",
                    name: {
                        fr: "À un étage et demi",
                        en: "One and a half storeys"
                    }
                }
            ],
            agents: [
                {
                    id: "No Preference",
                    name: {
                        fr: "Pas de préférence",
                        en: "No Preference"
                    }
                },
                {
                    id: "Emma Thompson",
                    name: "Emma Thompson"
                },
                {
                    id: "Liam Carter",
                    name: "Liam Carter"
                },
                {
                    id: "Sophia Martinez",
                    name: "Sophia Martinez"
                },
                {
                    id: "Ethan Brown",
                    name: "Ethan Brown"
                },
                {
                    id: "Olivia Davis",
                    name: "Olivia Davis"
                },
                {
                    id: "Noah Wilson",
                    name: "Noah Wilson"
                },
                {
                    id: "Ava Johnson",
                    name: "Ava Johnson"
                }
            ]
        },
        translations: {
            fr: {
                nav: {
                    next: "Suivant",
                    previous: "Précédent",
                    submit: "Soumettre ma propriété",
                    processing: "Traitement en cours..."
                },
                common: {
                    yes: "Oui",
                    no: "Non",
                    other: "Autre",
                    required: "requis",
                    fieldRequired: "Ce champ est requis",
                    edit: "Modifier",
                    notSpecified: "Non spécifié",
                    none: "Aucun",
                    pleaseSpecify: "Veuillez préciser...",
                    selectAtLeastOne: "Veuillez sélectionner au moins une option"
                },
                steps: [
                    {
                        title: "Informations de contact",
                        desc: "Vos coordonnées personnelles"
                    },
                    {
                        title: "Type et localisation",
                        desc: "Catégorie et adresse de votre propriété"
                    },
                    {
                        title: "Détails de la propriété",
                        desc: "Caractéristiques principales"
                    },
                    {
                        title: "Équipements et commodités",
                        desc: "Garage, piscine et autres"
                    },
                    {
                        title: "Résumé de votre propriété",
                        desc: "Vérifiez les informations avant soumission"
                    }
                ],
                fields: {
                    firstName: "Prénom",
                    lastName: "Nom de famille",
                    email: "Adresse courriel",
                    phone: "Numéro de téléphone",
                    agent: "Agent immobilier préféré",
                    propertyCategory: "Catégorie de propriété",
                    propertyType: "Type de propriété",
                    streetAddress: "Adresse civique",
                    city: "Ville",
                    postalCode: "Code postal",
                    rooms: "Nombre de pièces total",
                    bedrooms: "Chambres à coucher",
                    bathrooms: "Salles de bain",
                    yearBuilt: "Année de construction",
                    area: "Superficie (pi²)",
                    garage: "Avez-vous un garage ?",
                    garageCapacity: "Capacité du garage (nombre de voitures)",
                    outsideParking: "Avez-vous un stationnement extérieur ?",
                    swimmingPool: "Avez-vous une piscine ?",
                    additionalInfo: "Informations supplémentaires"
                },
                placeholders: {
                    additionalInfo: "Décrivez toute information supplémentaire sur votre propriété..."
                },
                errors: {
                    firstName: "Veuillez saisir votre prénom",
                    lastName: "Veuillez saisir votre nom de famille",
                    email: "Veuillez saisir une adresse courriel valide",
                    emailInvalid: "Le format de l'adresse courriel n'est pas valide",
                    phone: "Veuillez saisir un numéro de téléphone valide",
                    phoneInvalid: "Le format du numéro de téléphone n'est pas valide",
                    agent: "Veuillez sélectionner un agent",
                    propertyCategory: "Veuillez sélectionner une catégorie de propriété",
                    propertyType: "Veuillez sélectionner un type de propriété",
                    streetAddress: "Veuillez saisir l'adresse civique",
                    city: "Veuillez saisir la ville",
                    postalCode: "Veuillez saisir le code postal",
                    rooms: "Veuillez indiquer le nombre de pièces",
                    bedrooms: "Veuillez indiquer le nombre de chambres",
                    bathrooms: "Veuillez indiquer le nombre de salles de bain",
                    yearBuilt: "Veuillez indiquer l'année de construction",
                    yearBuiltInvalid: "L'année de construction doit être 1900 ou plus récente",
                    area: "Veuillez indiquer la superficie",
                    areaInvalid: "La superficie doit être d'au moins 100 pi²",
                    garage: "Veuillez indiquer si vous avez un garage",
                    outsideParking: "Veuillez indiquer si vous avez un stationnement extérieur",
                    swimmingPool: "Veuillez indiquer si vous avez une piscine",
                    selectAtLeastOne: "Veuillez sélectionner au moins une option"
                },
                success: {
                    title: "Propriété soumise avec succès !",
                    message: "Votre demande de vente de propriété a été soumise avec succès. Notre équipe examinera vos informations et vous contactera bientôt pour discuter des prochaines étapes."
                },
                summary: {
                    title: "Résumé de votre propriété",
                    description: "Vérifiez les informations de votre propriété avant la soumission finale.",
                    editStep: "Modifier cette étape",
                    noDataProvided: "Aucune donnée fournie pour cette section"
                }
            },
            en: {
                nav: {
                    next: "Next",
                    previous: "Previous",
                    submit: "Submit My Property",
                    processing: "Processing..."
                },
                common: {
                    yes: "Yes",
                    no: "No",
                    other: "Other",
                    required: "required",
                    fieldRequired: "This field is required",
                    edit: "Edit",
                    notSpecified: "Not specified",
                    none: "None",
                    pleaseSpecify: "Please specify...",
                    selectAtLeastOne: "Please select at least one option"
                },
                steps: [
                    {
                        title: "Contact Information",
                        desc: "Your personal details"
                    },
                    {
                        title: "Type and Location",
                        desc: "Property category and address"
                    },
                    {
                        title: "Property Details",
                        desc: "Main characteristics"
                    },
                    {
                        title: "Amenities and Features",
                        desc: "Garage, pool and others"
                    },
                    {
                        title: "Property Summary",
                        desc: "Review information before submission"
                    }
                ],
                fields: {
                    firstName: "First Name",
                    lastName: "Last Name",
                    email: "Email Address",
                    phone: "Phone Number",
                    agent: "Preferred Real Estate Agent",
                    propertyCategory: "Property Category",
                    propertyType: "Property Type",
                    streetAddress: "Street Address",
                    city: "City",
                    postalCode: "Postal Code",
                    rooms: "Total Number of Rooms",
                    bedrooms: "Bedrooms",
                    bathrooms: "Bathrooms",
                    yearBuilt: "Year Built",
                    area: "Area (sq ft)",
                    garage: "Do you have a garage?",
                    garageCapacity: "Garage Capacity (number of cars)",
                    outsideParking: "Do you have outside parking?",
                    swimmingPool: "Do you have a swimming pool?",
                    additionalInfo: "Additional Information"
                },
                placeholders: {
                    additionalInfo: "Describe any additional information about your property..."
                },
                errors: {
                    firstName: "Please enter your first name",
                    lastName: "Please enter your last name",
                    email: "Please enter a valid email address",
                    emailInvalid: "Email format is not valid",
                    phone: "Please enter a valid phone number",
                    phoneInvalid: "Phone number format is not valid",
                    agent: "Please select an agent",
                    propertyCategory: "Please select a property category",
                    propertyType: "Please select a property type",
                    streetAddress: "Please enter the street address",
                    city: "Please enter the city",
                    postalCode: "Please enter the postal code",
                    rooms: "Please specify the number of rooms",
                    bedrooms: "Please specify the number of bedrooms",
                    bathrooms: "Please specify the number of bathrooms",
                    yearBuilt: "Please specify the year built",
                    yearBuiltInvalid: "Year built must be 1900 or later",
                    area: "Please specify the area",
                    areaInvalid: "Area must be at least 100 sq ft",
                    garage: "Please indicate if you have a garage",
                    outsideParking: "Please indicate if you have outside parking",
                    swimmingPool: "Please indicate if you have a swimming pool",
                    selectAtLeastOne: "Please select at least one option"
                },
                success: {
                    title: "Property Submitted Successfully!",
                    message: "Your property selling request has been submitted successfully. Our team will review your information and contact you soon to discuss the next steps."
                },
                summary: {
                    title: "Property Summary",
                    description: "Review your property information before final submission.",
                    editStep: "Edit this step",
                    noDataProvided: "No data provided for this section"
                }
            }
        }
    },
    // ============================================================================
    // FORM CONFIGURATION - Field definitions and step structure
    // ============================================================================
    FORM_CONFIG: {
        steps: [
            // Step 1: Contact Information
            {
                sectionId: "contact_information", // NEW: Explicit section ID for generic processing
                fields: [
                    {
                        type: 'text',
                        id: 'firstName',
                        required: true,
                        row: 'name',
                        getCustomErrorMessage: (lang) => PropertySellFormExtension.FORM_DATA.translations[lang].errors.firstName
                    },
                    {
                        type: 'text',
                        id: 'lastName',
                        required: true,
                        row: 'name',
                        getCustomErrorMessage: (lang) => PropertySellFormExtension.FORM_DATA.translations[lang].errors.lastName
                    },
                    {
                        type: 'email',
                        id: 'email',
                        required: true,
                        row: 'contact',
                        getCustomErrorMessage: (lang) => PropertySellFormExtension.FORM_DATA.translations[lang].errors.email,
                        getCustomErrorMessages: (lang) => ({
                            required: PropertySellFormExtension.FORM_DATA.translations[lang].errors.email,
                            invalid: PropertySellFormExtension.FORM_DATA.translations[lang].errors.emailInvalid
                        })
                    },
                    {
                        type: 'phone',
                        id: 'phone',
                        required: true,
                        row: 'contact',
                        getCustomErrorMessage: (lang) => PropertySellFormExtension.FORM_DATA.translations[lang].errors.phone,
                        getCustomErrorMessages: (lang) => ({
                            required: PropertySellFormExtension.FORM_DATA.translations[lang].errors.phone,
                            phone: PropertySellFormExtension.FORM_DATA.translations[lang].errors.phoneInvalid
                        })
                    },
                    {
                        type: 'select',
                        id: 'agent',
                        row: 'agent',
                        required: true,
                        options: 'agents',
                        getCustomErrorMessage: (lang) => PropertySellFormExtension.FORM_DATA.translations[lang].errors.agent
                    }
                ]
            },

            // Step 2: Property Type & Location
            {
                sectionId: "property_type_location", // NEW: Explicit section ID
                fields: [
                    {
                        type: 'select-subsections',
                        id: 'propertyCategory',
                        required: true,
                        subsectionOptions: 'propertyCategories',
                        row: 'property-type',
                        getCustomErrorMessage: (lang) => PropertySellFormExtension.FORM_DATA.translations[lang].errors.propertyCategory
                    },
                    {
                        type: 'select',
                        id: 'propertyType',
                        required: true,
                        options: 'propertyTypes',
                        row: 'property-type',
                        getCustomErrorMessage: (lang) => PropertySellFormExtension.FORM_DATA.translations[lang].errors.propertyType
                    },
                    {
                        type: 'text',
                        id: 'streetAddress',
                        required: true,
                        row: 'streetAddress',
                        getCustomErrorMessage: (lang) => PropertySellFormExtension.FORM_DATA.translations[lang].errors.streetAddress
                    },
                    {
                        type: 'text',
                        id: 'city',
                        required: true,
                        row: 'location',
                        getCustomErrorMessage: (lang) => PropertySellFormExtension.FORM_DATA.translations[lang].errors.city
                    },
                    {
                        type: 'text',
                        id: 'postalCode',
                        required: true,
                        row: 'location',
                        getCustomErrorMessage: (lang) => PropertySellFormExtension.FORM_DATA.translations[lang].errors.postalCode
                    }
                ]
            },

            // Step 3: Property Details
            {
                sectionId: "property_details", // NEW: Explicit section ID
                fields: [
                    {
                        type: 'number',
                        id: 'rooms',
                        required: true,
                        min: 1,
                        max: 50,
                        row: 'room-details',
                        getCustomErrorMessage: (lang) => PropertySellFormExtension.FORM_DATA.translations[lang].errors.rooms
                    },
                    {
                        type: 'number',
                        id: 'bedrooms',
                        required: true,
                        min: 1,
                        max: 20,
                        row: 'room-details',
                        getCustomErrorMessage: (lang) => PropertySellFormExtension.FORM_DATA.translations[lang].errors.bedrooms
                    },
                    {
                        type: 'number',
                        id: 'bathrooms',
                        required: true,
                        min: 1,
                        max: 20,
                        row: 'room-details',
                        getCustomErrorMessage: (lang) => PropertySellFormExtension.FORM_DATA.translations[lang].errors.bathrooms
                    },
                    {
                        type: 'number',
                        id: 'yearBuilt',
                        required: true,
                        min: 1900,
                        max: new Date()
                            .getFullYear(),
                        row: 'construction-details',
                        getCustomErrorMessage: (lang) => PropertySellFormExtension.FORM_DATA.translations[lang].errors.yearBuilt,
                        getCustomErrorMessages: (lang) => ({
                            required: PropertySellFormExtension.FORM_DATA.translations[lang].errors.yearBuilt,
                            min: PropertySellFormExtension.FORM_DATA.translations[lang].errors.yearBuiltInvalid
                        })
                    },
                    {
                        type: 'number',
                        id: 'area',
                        required: true,
                        min: 100,
                        row: 'construction-details',
                        getCustomErrorMessage: (lang) => PropertySellFormExtension.FORM_DATA.translations[lang].errors.area,
                        getCustomErrorMessages: (lang) => ({
                            required: PropertySellFormExtension.FORM_DATA.translations[lang].errors.area,
                            min: PropertySellFormExtension.FORM_DATA.translations[lang].errors.areaInvalid
                        })
                    }
                ]
            },

            // Step 4: Features and Amenities
            {
                sectionId: "features_amenities", // NEW: Explicit section ID
                fields: [
                    {
                        type: 'yesno-with-options',
                        id: 'garage',
                        required: true,
                        getCustomErrorMessage: (lang) => PropertySellFormExtension.FORM_DATA.translations[lang].errors.garage,
                        yesField: {
                            type: 'number',
                            id: 'garageCapacity',
                            row: 'garageCapacity',
                            required: false,
                            min: 1,
                            max: 10
                        }
                    },
                    {
                        type: 'yesno',
                        id: 'outsideParking',
                        required: true,
                        getCustomErrorMessage: (lang) => PropertySellFormExtension.FORM_DATA.translations[lang].errors.outsideParking
                    },
                    {
                        type: 'yesno',
                        id: 'swimmingPool',
                        required: true,
                        getCustomErrorMessage: (lang) => PropertySellFormExtension.FORM_DATA.translations[lang].errors.swimmingPool
                    },
                    {
                        type: 'textarea',
                        id: 'additionalInfo',
                        row: 'additionalInfo',
                        required: false,
                        maxLength: 1000,
                        rows: 4,
                        getPlaceholder: (lang) => PropertySellFormExtension.FORM_DATA.translations[lang].placeholders.additionalInfo
                    }
                ]
            },

            // Step 5: Property Summary
            {
                sectionId: "property_summary", // NEW: Explicit section ID
                fields: [
                    {
                        type: 'custom',
                        id: 'summary',
                        name: 'summary',
                        autoSummary: true,
                        getSummaryData: true,
                        label: ''
                    }
                ]
            }
        ]
    }
};
// ============================================================================
// FIXED REAL ESTATE BOOKING CALENDAR EXTENSION
// ============================================================================
const BookingCalendarExtension = {
    name: "RealEstateBookingCalendar",
    type: "response",
    match: ({ trace }) => trace.type === "ext_real_estate_booking" || 
                          trace.type === "ext_booking_calendar" || 
                          trace.type === "ext_booking_calendar_d" || 
                          trace.payload?.name === "ext_real_estate_booking" ||
                          trace.payload?.name === "ext_booking_calendar" ||
                          trace.payload?.name === "ext_booking_calendar_d",
    
    render: async ({ trace, element }) => {
        let { 
            language = "fr", 
            vf,
            timezone = CONFIG.DEFAULT_TIMEZONE,
            agency = CONFIG.DEFAULT_AGENCY,
            agentsInformation = null,
            specialistsInfo = null,
            categoryItems = null,
            webhookEnabled = false,
            webhookUrl = null,
            voiceflowEnabled = true,
            voiceflowDataTransformer = null,
            enableDetailedLogging = true,
            logPrefix = "🏠 RealEstateBooking",
            enableSessionTimeout = true,
            sessionTimeout = CONFIG.SESSION_TIMEOUT,
            sessionWarning = CONFIG.SESSION_WARNING,
            cssUrls = CONFIG.DEFAULT_CSS,
            formType = "real_estate_booking",
            formStructure = "multistep",
            useStructuredData = true,
            dataTransformer = BaseDataTransformer
        } = trace.payload || {};

        
        
        // Helper function to get translated text
        const getTranslatedText = (key, lang = language) => {
            const keys = key.split('.');
            let value = BookingCalendarExtension.FORM_DATA.translations[lang];
            for (const k of keys) {
                value = value?.[k];
            }
            return value || key;
        };

        // Validate that agentsInformation is provided and has content
        if (!agentsInformation || Object.keys(agentsInformation).length === 0) {
            console.error('BookingCalendarExtension: agentsInformation is required in payload');
            element.innerHTML = `
                <div class="error-state" style="padding: 20px; text-align: center; color: #e74c3c;">
                    <h3>${getTranslatedText('errors.configurationError')}</h3>
                    <p>${getTranslatedText('errors.agentsInformationRequired')}</p>
                </div>
            `;
            return;
        }

        // Convert agentsInformation to the format expected by the calendar field
        const convertedAgentsInfo = BookingCalendarExtension.convertAgentsInformation(agentsInformation);
        
        // Update form data with agents information
        const updatedFormData = JSON.parse(JSON.stringify(BookingCalendarExtension.FORM_DATA));
        updatedFormData.agentsInformation = agentsInformation;
        updatedFormData.categoryItems = convertedAgentsInfo;

        // Clone the form config and populate variables dynamically
        const formConfig = JSON.parse(JSON.stringify(BookingCalendarExtension.FORM_CONFIG));
        
        // ===============================
        // FIX: Use 'item-calendar' type and set proper configuration
        // ===============================
        const calendarField = formConfig.steps[1].fields[0];
        
        // Set calendar configuration for agent selection
        calendarField.timezone = timezone;
        calendarField.language = language;
        calendarField.locale = language === 'fr' ? 'fr-FR' : 'en-US';
        calendarField.categoryName = "Real Estate Meeting"; // IMPORTANT: Set the category name
        calendarField.eventName = "Real Estate Meeting"; // Alternative property name
        calendarField.categoryItems = convertedAgentsInfo; // Provide the converted agents data
        calendarField.specialistsInfo = convertedAgentsInfo; // Alternative property name
        calendarField.showItemInfo = true;
        calendarField.mode = 'booking';
        
        // ===============================
        // PROVIDE ALL TRANSLATED TEXTS TO CALENDAR FIELD
        // ===============================
        const calendarTranslations = BookingCalendarExtension.FORM_DATA.translations[language].calendar;
        calendarField.texts = {
            selectItem: calendarTranslations.selectAgent, // Map agent selection to item selection
            selectItemPlaceholder: calendarTranslations.selectAgentPlaceholder,
            selectDate: calendarTranslations.selectDate,
            availableTimesFor: calendarTranslations.availableTimesFor,
            noAvailableSlots: calendarTranslations.noAvailableSlots,
            pleaseSelectDate: calendarTranslations.pleaseSelectDate,
            pleaseSelectItem: calendarTranslations.pleaseSelectAgent, // Map agent selection to item selection
            currentAppointment: calendarTranslations.currentAppointment,
            newAppointment: calendarTranslations.newAppointment,
            loadingAvailability: calendarTranslations.loadingAvailability,
            loading: calendarTranslations.loading,
            weekdays: calendarTranslations.weekdays
        };
        
        // Provide error texts to calendar field
        calendarField.errorTexts = {
            itemRequired: BookingCalendarExtension.FORM_DATA.translations[language].errors.agentRequired, // Map agent to item
            dateTimeRequired: BookingCalendarExtension.FORM_DATA.translations[language].errors.dateTimeRequired,
            bookingError: BookingCalendarExtension.FORM_DATA.translations[language].errors.bookingError
        };
        
        // Create the form with the fixed configuration
        const extension = new CreatForm(
            {
                language: language,
                formType: formType,
                formStructure: formStructure,
                useStructuredData: useStructuredData,
                dataTransformer: dataTransformer,
                webhookEnabled: webhookEnabled,
                webhookUrl: webhookUrl,
                voiceflowEnabled: voiceflowEnabled,
                voiceflowDataTransformer: voiceflowDataTransformer,
                enableDetailedLogging: enableDetailedLogging,
                logPrefix: logPrefix,
                enableSessionTimeout: enableSessionTimeout,
                sessionTimeout: sessionTimeout,
                sessionWarning: sessionWarning,
                timezone: timezone,
                agency: agency,
                cssUrls: cssUrls
            },
            updatedFormData,
            formConfig,
            {
                DEFAULT_WEBHOOK: CONFIG.DEFAULT_WEBHOOK,
                DEFAULT_CSS: CONFIG.DEFAULT_CSS,
                SESSION_TIMEOUT: CONFIG.SESSION_TIMEOUT,
                SESSION_WARNING: CONFIG.SESSION_WARNING,
                DEBOUNCE_DELAY: CONFIG.DEBOUNCE_DELAY,
                FORM_VERSION: CONFIG.FORM_VERSION
            }
        );

        return await extension.render(element);
    },

    // ============================================================================
    // FORM DATA CONFIGURATION
    // ============================================================================
    FORM_DATA: {
        agentsInformation: {},
        
        translations: {
            fr: {
                nav: { 
                    next: "Suivant", 
                    previous: "Précédent", 
                    submit: "Confirmer le rendez-vous", 
                    processing: "Traitement en cours..." 
                },
                common: { 
                    yes: "Oui", 
                    no: "Non", 
                    other: "Autre", 
                    required: "requis", 
                    fieldRequired: "Ce champ est requis", 
                    edit: "Modifier", 
                    notSpecified: "Non spécifié", 
                    none: "Aucun",
                    pleaseSpecify: "Veuillez préciser...",
                    selectAtLeastOne: "Veuillez sélectionner au moins une option"
                },
                labels: {
                    agent: "Agent immobilier",
                    selectedAgent: "Agent sélectionné",
                    appointmentDetails: "Détails du rendez-vous",
                    meetingType: "Type de rencontre"
                },
                placeholders: {
                    firstName: "Entrez votre prénom",
                    lastName: "Entrez votre nom de famille",
                    email: "votre.email@example.com"
                },
                steps: [
                    { title: "Informations de Contact", desc: "Renseignez vos informations de contact" },
                    { title: "Rendez-vous avec l'Agent", desc: "Choisissez votre agent immobilier et votre créneau" }
                ],
                fields: {
                    firstName: "Prénom",
                    lastName: "Nom de famille",
                    email: "Adresse électronique",
                    appointment: "Sélectionnez un agent immobilier, date et heure",
                    scheduledWith: "Rendez-vous avec",
                    meetingType: "Type de rencontre"
                },
                errors: {
                    firstName: "Veuillez saisir votre prénom",
                    lastName: "Veuillez saisir votre nom de famille",
                    email: "Veuillez saisir une adresse email valide",
                    emailInvalid: "Le format de l'adresse e-mail n'est pas valide",
                    appointment: "Veuillez sélectionner un agent immobilier, une date et une heure",
                    dateTimeRequired: "Veuillez sélectionner une date et une heure",
                    agentRequired: "Veuillez sélectionner un agent immobilier",
                    bookingError: "Erreur lors de la réservation. Veuillez réessayer.",
                    configurationError: "Erreur de Configuration",
                    agentsInformationRequired: "Les informations des agents immobiliers sont requises mais n'ont pas été fournies dans la charge utile."
                },
                success: { 
                    title: "Rendez-vous confirmé !", 
                    message: "Votre rendez-vous avec l'agent immobilier a été programmé avec succès. Vous recevrez sous peu un email de confirmation." 
                },
                calendar: {
                    selectAgent: "Sélectionner un agent immobilier",
                    selectAgentPlaceholder: "-- Sélectionner un agent --",
                    selectDate: "Sélectionnez une date pour voir les horaires disponibles",
                    availableTimesFor: "Disponibilités pour",
                    noAvailableSlots: "Aucun horaire disponible pour cette date",
                    pleaseSelectDate: "Veuillez d'abord sélectionner une date",
                    pleaseSelectAgent: "Veuillez d'abord sélectionner un agent immobilier",
                    currentAppointment: "Rendez-vous Actuel",
                    newAppointment: "Nouveau Rendez-vous",
                    loadingAvailability: "Chargement des disponibilités...",
                    loading: "Chargement...",
                    weekdays: ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"]
                }
            },
            
            en: {
                nav: { 
                    next: "Next", 
                    previous: "Previous", 
                    submit: "Confirm Appointment", 
                    processing: "Processing..." 
                },
                common: { 
                    yes: "Yes", 
                    no: "No", 
                    other: "Other", 
                    required: "required", 
                    fieldRequired: "This field is required", 
                    edit: "Edit", 
                    notSpecified: "Not specified", 
                    none: "None",
                    pleaseSpecify: "Please specify...",
                    selectAtLeastOne: "Please select at least one option"
                },
                labels: {
                    agent: "Real Estate Agent",
                    selectedAgent: "Selected Agent",
                    appointmentDetails: "Appointment Details",
                    meetingType: "Meeting Type"
                },
                placeholders: {
                    firstName: "Enter your first name",
                    lastName: "Enter your last name",
                    email: "your.email@example.com"
                },
                steps: [
                    { title: "Contact Information", desc: "Enter your contact information" },
                    { title: "Agent Appointment", desc: "Choose your real estate agent and time slot" }
                ],
                fields: {
                    firstName: "First Name",
                    lastName: "Last Name",
                    email: "Email Address",
                    appointment: "Select real estate agent, date and time",
                    scheduledWith: "Appointment with",
                    meetingType: "Meeting Type"
                },
                errors: {
                    firstName: "Please enter your first name",
                    lastName: "Please enter your last name",
                    email: "Please enter a valid email address",
                    emailInvalid: "Email format is not valid",
                    appointment: "Please select a real estate agent, date and time",
                    dateTimeRequired: "Please select a date and time",
                    agentRequired: "Please select a real estate agent",
                    bookingError: "Booking error. Please try again.",
                    configurationError: "Configuration Error",
                    agentsInformationRequired: "Real estate agents information is required but not provided in the payload."
                },
                success: { 
                    title: "Appointment Confirmed!", 
                    message: "Your appointment with the real estate agent has been successfully scheduled. You will receive a confirmation email shortly." 
                },
                calendar: {
                    selectAgent: "Select a real estate agent",
                    selectAgentPlaceholder: "-- Select an agent --",
                    selectDate: "Select a date to view available times",
                    availableTimesFor: "Available times for",
                    noAvailableSlots: "No available time slots for this date",
                    pleaseSelectDate: "Please select a date first",
                    pleaseSelectAgent: "Please select a real estate agent first",
                    currentAppointment: "Current Appointment",
                    newAppointment: "New Appointment",
                    loadingAvailability: "Loading availability...",
                    loading: "Loading...",
                    weekdays: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
                }
            }
        }
    },

    // ============================================================================
    // FIXED FORM CONFIGURATION
    // ============================================================================
    FORM_CONFIG: {
        steps: [
            // Step 1: Contact Information
            {
                sectionId: "contact_information",
                fields: [
                    {
                        type: 'text',
                        id: 'firstName',
                        required: true,
                        row: 'name',
                        getPlaceholder: (lang) => BookingCalendarExtension.FORM_DATA.translations[lang].placeholders.firstName,
                        getCustomErrorMessage: (lang) => BookingCalendarExtension.FORM_DATA.translations[lang].errors.firstName
                    },
                    {
                        type: 'text',
                        id: 'lastName',
                        required: true,
                        row: 'name',
                        getPlaceholder: (lang) => BookingCalendarExtension.FORM_DATA.translations[lang].placeholders.lastName,
                        getCustomErrorMessage: (lang) => BookingCalendarExtension.FORM_DATA.translations[lang].errors.lastName
                    },
                    {
                        type: 'email',
                        id: 'email',
                        required: true,
                        row: 'email',
                        getPlaceholder: (lang) => BookingCalendarExtension.FORM_DATA.translations[lang].placeholders.email,
                        getCustomErrorMessage: (lang) => BookingCalendarExtension.FORM_DATA.translations[lang].errors.email,
                        getCustomErrorMessages: (lang) => ({
                            required: BookingCalendarExtension.FORM_DATA.translations[lang].errors.email,
                            invalid: BookingCalendarExtension.FORM_DATA.translations[lang].errors.emailInvalid
                        })
                    }
                ]
            },
            
            // Step 2: Agent Calendar Selection - FIXED
            {
                sectionId: "agent_appointment_scheduling",
                fields: [
                    {
                        // FIX: Use 'item-calendar' instead of 'agent-calendar'
                        type: 'item-calendar',
                        id: 'appointment',
                        row: 'appointment',
                        required: true,
                        mode: 'booking',
                        headerIcon: 'CALENDAR',
                        
                        // These will be populated dynamically during render()
                        timezone: '{{timezone}}',
                        language: '{{language}}',
                        categoryName: 'Real Estate Meeting', // IMPORTANT: This sets the selectedCategory
                        eventName: 'Real Estate Meeting', // Alternative property name
                        categoryItems: '{{categoryItems}}', // This provides the agents data
                        specialistsInfo: '{{specialistsInfo}}', // Alternative property name
                        showItemInfo: '{{showItemInfo}}',
                        
                        getCustomErrorMessage: (lang) => BookingCalendarExtension.FORM_DATA.translations[lang].errors.appointment,
                        getCustomErrorMessages: (lang) => ({
                            required: BookingCalendarExtension.FORM_DATA.translations[lang].errors.dateTimeRequired,
                            itemRequired: BookingCalendarExtension.FORM_DATA.translations[lang].errors.agentRequired, // Map agent to item
                            bookingError: BookingCalendarExtension.FORM_DATA.translations[lang].errors.bookingError
                        })
                    }
                ]
            }
        ]
    },

    // ============================================================================
    // HELPER METHODS
    // ============================================================================

    // Convert agentsInformation to format expected by ItemCalendarField
    convertAgentsInformation: (agentsInformation) => {
        const converted = {};
        
        Object.entries(agentsInformation).forEach(([agentName, agentData]) => {
            converted[agentName] = {
                apiKey: agentData.apikey || agentData.apiKey,
                scheduleId: agentData.scheduleId,
                categories: {
                    "Real Estate Meeting": {
                        eventSlug: agentData.eventSlug || "meeting",
                        eventId: agentData.eventId,
                        link: `${agentName.toLowerCase().replace(/\s+/g, '-')}/${agentData.eventSlug || "meeting"}`
                    }
                }
            };
        });
        
        return converted;
    }
};
// ============================================================================
// ENHANCED RESCHEDULE CALENDAR EXTENSION - RESTRUCTURED ARCHITECTURE
// ============================================================================
const RescheduleCalendarExtension = {
    name: "ModernRescheduleCalendar",
    type: "response",
    match: ({
        trace
    }) => trace.type === "ext_reschedule_calendar" || trace.payload?.name === "ext_reschedule_calendar",
    // ============================================================================
    // INITIALIZE REUSABLE CAL.COM UTILITY
    // ============================================================================
    initializeCalComUtility(config) {
        if (!this.calComUtility) {
            this.calComUtility = new CalComBaseUtility({
                apiKey: config.apiKey,
                logPrefix: "📅 RescheduleCalendar",
                enableLogging: config.enableDetailedLogging !== false,
                errorMessages: {
                    missingNewTime: "New appointment time is required",
                    reschedulingFailed: "Failed to reschedule booking"
                }
            });
        } else {
            if (config.apiKey) {
                this.calComUtility.setApiKey(config.apiKey);
            }
        }
        return this.calComUtility;
    },
    render: async ({
        trace,
        element
    }) => {
        // ============================================================================
        // EXTRACT ALL PAYLOAD DATA INTO VARIABLES USING DESTRUCTURING
        // ============================================================================
        let {
            language = "fr",
                vf,
                apiKey = CONFIG.DEFAULT_API_KEY,
                uid = "",
                email = "",
                serviceProvider = "Dr. Sophie Martin",
                startTime = "",
                scheduleId = "",
                eventTypeId = "",
                eventTypeSlug = "",
                timezone = "America/Toronto",
                voiceflowEnabled = true,
                voiceflowDataTransformer = null,
                enableDetailedLogging = true,
                logPrefix = "📅 RescheduleCalendar",
                enableSessionTimeout = true,
                sessionTimeout = CONFIG.SESSION_TIMEOUT,
                sessionWarning = CONFIG.SESSION_WARNING,
                cssUrls = CONFIG.DEFAULT_CSS,
                formType = "reschedule",
                formStructure = "multistep",
                useStructuredData = true,
                dataTransformer = BaseDataTransformer
        } = trace.payload || {};
        // Extract reschedule details from extracted variables
        const rescheduleData = {
            uid: uid,
            email: email,
            serviceProvider: serviceProvider,
            startTime: startTime,
            scheduleId: scheduleId,
            eventTypeId: eventTypeId,
            eventTypeSlug: eventTypeSlug
        };
        // Initialize Cal.com utility using extracted variables
        const calComUtility = RescheduleCalendarExtension.initializeCalComUtility({
            apiKey: apiKey,
            enableDetailedLogging: enableDetailedLogging
        });
        // Helper function to get translated text
        const getTranslatedText = (key, lang = language) => {
            const keys = key.split('.');
            let value = RescheduleCalendarExtension.FORM_DATA.translations[lang];
            for (const k of keys) {
                value = value?.[k];
            }
            return value || key;
        };
        // Get service name for display using utility
        const serviceName = calComUtility.getServiceName(
            rescheduleData.eventTypeSlug,
            rescheduleData.serviceProvider,
            RescheduleCalendarExtension.FORM_DATA.serviceMapping
        );
        // Clone the form config and populate variables dynamically
        const formConfig = JSON.parse(JSON.stringify(RescheduleCalendarExtension.FORM_CONFIG));
        // Populate currentAppointmentCard field in step 1
        const appointmentCardField = formConfig.steps[0].fields[0];
        appointmentCardField.serviceProvider = rescheduleData.serviceProvider;
        appointmentCardField.startTime = rescheduleData.startTime;
        appointmentCardField.serviceName = serviceName;
        appointmentCardField.eventTypeSlug = rescheduleData.eventTypeSlug;
        appointmentCardField.language = language;
        appointmentCardField.translations = RescheduleCalendarExtension.FORM_DATA.translations;
        appointmentCardField.serviceMapping = RescheduleCalendarExtension.FORM_DATA.serviceMapping;
        // Populate textarea field with translations
        const textareaField = formConfig.steps[0].fields[1];
        textareaField.placeholder = getTranslatedText('fields.rescheduleReasonPlaceholder');
        textareaField.customErrorMessage = getTranslatedText('errors.reasonRequired');
        textareaField.customErrorMessages = {
            required: getTranslatedText('errors.reasonRequired')
        };
        // Populate calendar field variables dynamically
        const calendarField = formConfig.steps[1].fields[0];
        // Set calendar configuration variables
        calendarField.apiKey = apiKey;
        calendarField.timezone = timezone;
        calendarField.language = language;
        calendarField.locale = language === 'fr' ? 'fr-FR' : 'en-US';
        calendarField.serviceProvider = rescheduleData.serviceProvider;
        // Set reschedule-specific variables
        calendarField.eventTypeId = parseInt(rescheduleData.eventTypeId);
        calendarField.eventTypeSlug = rescheduleData.eventTypeSlug;
        calendarField.scheduleId = rescheduleData.scheduleId;
        calendarField.serviceName = serviceName;
        calendarField.eventName = serviceName;
        calendarField.currentAppointment = rescheduleData.startTime;
        calendarField.uid = rescheduleData.uid;
        calendarField.email = rescheduleData.email;
        calendarField.mode = 'reschedule'; // IMPORTANT: Set mode to reschedule
        // Provide all translated texts to calendar field
        const calendarTranslations = RescheduleCalendarExtension.FORM_DATA.translations[language].calendar;
        calendarField.texts = {
            selectDate: calendarTranslations.selectDate,
            availableTimesFor: calendarTranslations.availableTimesFor,
            noAvailableSlots: calendarTranslations.noAvailableSlots,
            pleaseSelectDate: calendarTranslations.pleaseSelectDate,
            currentAppointment: calendarTranslations.currentAppointment,
            newAppointment: calendarTranslations.newAppointment,
            loadingAvailability: calendarTranslations.loadingAvailability,
            loading: calendarTranslations.loading,
            weekdays: calendarTranslations.weekdays
        };
        // Provide error texts to calendar field
        calendarField.errorTexts = {
            dateTimeRequired: RescheduleCalendarExtension.FORM_DATA.translations[language].errors.dateTimeRequired,
            rescheduleError: RescheduleCalendarExtension.FORM_DATA.translations[language].errors.rescheduleError
        };
        // ============================================================================
        // FIXED: Disable CreatForm's Voiceflow - CalComBaseUtility handles it
        // This prevents double-sending to Voiceflow
        // ============================================================================
        // Create the form with the new generic architecture using extracted variables
        const extension = new CreatForm({
                language: language,
                formType: formType,
                formStructure: formStructure,
                // ============================================================================
                // NEW: Generic approach - no specific field transformers needed!
                // BaseDataTransformer + FormDataProcessor handle everything automatically
                // ============================================================================
                useStructuredData: useStructuredData,
                dataTransformer: dataTransformer, // Generic transformer works with any form!
                // DISABLED: Webhook integration (reschedule goes directly to Cal.com)
                webhookEnabled: false,
                webhookUrl: null,
                // FIXED: Disable CreatForm's Voiceflow - CalComBaseUtility handles it properly
                voiceflowEnabled: false, // ← CHANGED: was voiceflowEnabled, now false
                voiceflowDataTransformer: null, // ← This is ignored when voiceflowEnabled is false
                // Enhanced logging using extracted variables
                enableDetailedLogging: enableDetailedLogging,
                logPrefix: logPrefix,
                // Session management using extracted variables
                enableSessionTimeout: enableSessionTimeout,
                sessionTimeout: sessionTimeout,
                sessionWarning: sessionWarning,
                // Reschedule-specific configuration using extracted variables
                apiKey: apiKey,
                timezone: timezone,
                serviceProvider: rescheduleData.serviceProvider,
                // Reschedule appointment data
                uid: rescheduleData.uid,
                email: rescheduleData.email,
                currentStartTime: rescheduleData.startTime,
                eventTypeId: rescheduleData.eventTypeId,
                eventTypeSlug: rescheduleData.eventTypeSlug,
                scheduleId: rescheduleData.scheduleId,
                // ============================================================================
                // SIMPLIFIED: Just use the utility's handleReschedule method!
                // ============================================================================
                onSubmit: async (formData) => {
                    return await calComUtility.handleReschedule(formData, {
                        language: language,
                        uid: rescheduleData.uid,
                        apiKey: apiKey,
                        serviceProvider: rescheduleData.serviceProvider,
                        startTime: rescheduleData.startTime,
                        eventTypeSlug: rescheduleData.eventTypeSlug,
                        email: rescheduleData.email,
                        voiceflowEnabled: voiceflowEnabled, // ← This controls CalComBaseUtility's Voiceflow
                        formVersion: CONFIG.FORM_VERSION
                    });
                },
                // CSS configuration using extracted variables
                cssUrls: cssUrls
            },
            RescheduleCalendarExtension.FORM_DATA,
            formConfig
        );
        return await extension.render(element);
    },
    // ============================================================================
    // FORM DATA CONFIGURATION - Same as before, no changes needed
    // ============================================================================
    FORM_DATA: {
        serviceMapping: {
            'nettoyages-et-examens-dentaires': 'Nettoyages et examens dentaires',
            'consultation-dentaire': 'Consultation dentaire',
            'chirurgie-dentaire': 'Chirurgie dentaire',
            'orthodontie': 'Orthodontie',
            'implants-dentaires': 'Implants dentaires',
            'blanchiment-dentaire': 'Blanchiment dentaire',
            'discovery-call-15-minutes': 'Entretien Exploratoire',
            'demonstration-chatbot-15min': 'Démonstration de l\'Agent IA',
            'reunion-45min': 'Présentation Détaillée',
            'reunion-projet': 'Session de Travail'
        },
        translations: {
            fr: {
                nav: {
                    next: "Suivant",
                    previous: "Précédent",
                    submit: "Replanifier le rendez-vous",
                    processing: "Traitement en cours..."
                },
                common: {
                    yes: "Oui",
                    no: "Non",
                    other: "Autre",
                    required: "requis",
                    fieldRequired: "Ce champ est requis",
                    edit: "Modifier",
                    notSpecified: "Non spécifié",
                    none: "Aucun",
                    pleaseSpecify: "Veuillez préciser...",
                    selectAtLeastOne: "Veuillez sélectionner au moins une option"
                },
                labels: {
                    serviceProvider: "Prestataire de service",
                    currentAppointment: "Rendez-vous actuel",
                    newAppointment: "Nouveau rendez-vous",
                    rescheduleDetails: "Détails de la replanification"
                },
                placeholders: {
                    rescheduleReason: "Pourquoi souhaitez-vous replanifier ce rendez-vous ?"
                },
                steps: [
                    {
                        title: "Informations Actuelles",
                        desc: "Consultez les informations actuelles et indiquez la raison de la replanification"
                    },
                    {
                        title: "Nouvelle Date et Heure",
                        desc: "Choisissez votre nouveau créneau préféré"
                    }
                        ],
                fields: {
                    currentAppointment: "Rendez-vous Actuel",
                    scheduledWith: "Programmé avec",
                    currentDateTime: "Date et heure actuelles",
                    serviceName: "Service",
                    reschedulingFrom: "Replanification de",
                    rescheduleReason: "Raison de la replanification",
                    rescheduleReasonPlaceholder: "Pourquoi souhaitez-vous replanifier ce rendez-vous ?",
                    selectDateTime: "Sélectionner nouvelle date et heure"
                },
                errors: {
                    reasonRequired: "Veuillez indiquer la raison de la replanification",
                    dateTimeRequired: "Veuillez sélectionner une nouvelle date et heure",
                    rescheduleError: "Erreur lors de la replanification. Veuillez réessayer."
                },
                success: {
                    title: "Rendez-vous replanifié !",
                    message: "Votre rendez-vous a été replanifié avec succès. Vous recevrez sous peu un email de confirmation."
                },
                calendar: {
                    selectDate: "Sélectionnez une date pour voir les horaires disponibles",
                    availableTimesFor: "Disponibilités pour",
                    noAvailableSlots: "Aucun horaire disponible pour cette date",
                    pleaseSelectDate: "Veuillez d'abord sélectionner une date",
                    currentAppointment: "Rendez-vous Actuel",
                    newAppointment: "Nouveau Rendez-vous",
                    loadingAvailability: "Chargement des disponibilités...",
                    loading: "Chargement...",
                    weekdays: ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"]
                }
            },
            en: {
                nav: {
                    next: "Next",
                    previous: "Previous",
                    submit: "Reschedule Appointment",
                    processing: "Processing..."
                },
                common: {
                    yes: "Yes",
                    no: "No",
                    other: "Other",
                    required: "required",
                    fieldRequired: "This field is required",
                    edit: "Edit",
                    notSpecified: "Not specified",
                    none: "None",
                    pleaseSpecify: "Please specify...",
                    selectAtLeastOne: "Please select at least one option"
                },
                labels: {
                    serviceProvider: "Service Provider",
                    currentAppointment: "Current Appointment",
                    newAppointment: "New Appointment",
                    rescheduleDetails: "Reschedule Details"
                },
                placeholders: {
                    rescheduleReason: "Why do you want to reschedule this appointment?"
                },
                steps: [
                    {
                        title: "Current Information",
                        desc: "Review current information and provide reason for rescheduling"
                    },
                    {
                        title: "New Date & Time",
                        desc: "Choose your new preferred time slot"
                    }
                        ],
                fields: {
                    currentAppointment: "Current Appointment",
                    scheduledWith: "Scheduled with",
                    currentDateTime: "Current date and time",
                    serviceName: "Service",
                    reschedulingFrom: "Rescheduling from",
                    rescheduleReason: "Reason for rescheduling",
                    rescheduleReasonPlaceholder: "Why do you want to reschedule this appointment?",
                    selectDateTime: "Select new date and time"
                },
                errors: {
                    reasonRequired: "Please provide a reason for rescheduling",
                    dateTimeRequired: "Please select a new date and time",
                    rescheduleError: "Rescheduling error. Please try again."
                },
                success: {
                    title: "Appointment Rescheduled!",
                    message: "Your appointment has been successfully rescheduled. You will receive a confirmation email shortly."
                },
                calendar: {
                    selectDate: "Select a date to view available times",
                    availableTimesFor: "Available times for",
                    noAvailableSlots: "No available time slots for this date",
                    pleaseSelectDate: "Please select a date first",
                    currentAppointment: "Current Appointment",
                    newAppointment: "New Appointment",
                    loadingAvailability: "Loading availability...",
                    loading: "Loading...",
                    weekdays: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
                }
            }
        }
    },
    // ============================================================================
    // FORM CONFIGURATION - Same as before, no changes needed
    // ============================================================================
    FORM_CONFIG: {
        steps: [
                    // Step 1: Current Appointment Info + Reason
            {
                sectionId: "current_appointment_info", // NEW: Explicit section ID for generic processing
                fields: [
                    {
                        type: 'currentAppointmentCard',
                        id: 'currentAppointmentDisplay',
                        required: false,
                        serviceProvider: '{{serviceProvider}}',
                        startTime: '{{startTime}}',
                        serviceName: '{{serviceName}}',
                        eventTypeSlug: '{{eventTypeSlug}}',
                        language: '{{language}}',
                        cardStyle: 'default',
                        iconType: 'reschedule',
                        showServiceName: true,
                        showDateTime: true,
                        showProvider: true,
                        translations: '{{translations}}',
                        serviceMapping: '{{serviceMapping}}'
                            },
                    {
                        type: 'textarea',
                        id: 'rescheduleReason',
                        required: true,
                        row: 'rescheduleReason',
                        rows: 4,
                        maxLength: 500,
                        showCounter: true,
                        placeholder: '{{placeholder}}',
                        getCustomErrorMessage: (lang) => RescheduleCalendarExtension.FORM_DATA.translations[lang].errors.reasonRequired
                            }
                        ]
                    },

                    // Step 2: New Date/Time Selection
            {
                sectionId: "new_appointment_scheduling", // NEW: Explicit section ID for generic processing
                fields: [
                    {
                        type: 'calendar',
                        id: 'newAppointment',
                        row: 'newAppointment',
                        required: true,
                        mode: 'reschedule',
                        headerIcon: 'RESCHEDULE',
                        apiKey: '{{apiKey}}',
                        timezone: '{{timezone}}',
                        language: '{{language}}',
                        eventTypeId: '{{eventTypeId}}',
                        eventTypeSlug: '{{eventTypeSlug}}',
                        scheduleId: '{{scheduleId}}',
                        serviceProvider: '{{serviceProvider}}',
                        serviceName: '{{serviceName}}',
                        currentAppointment: '{{startTime}}',
                        eventName: '{{serviceName}}',
                        uid: '{{uid}}',
                        email: '{{email}}',
                        getCustomErrorMessage: (lang) => RescheduleCalendarExtension.FORM_DATA.translations[lang].errors.dateTimeRequired,
                        getCustomErrorMessages: (lang) => ({
                            required: RescheduleCalendarExtension.FORM_DATA.translations[lang].errors.dateTimeRequired,
                            rescheduleError: RescheduleCalendarExtension.FORM_DATA.translations[lang].errors.rescheduleError
                        })
                            }
                        ]
                    }
                ]
    }
};
// ============================================================================
// ENHANCED CANCELLATION DIRECT EXTENSION - RESTRUCTURED ARCHITECTURE
// ============================================================================
const CancellationDirectExtension = {
    name: "ModernCancellationDirect",
    type: "response",
    match: ({
        trace
    }) => trace.type === "ext_cancellation_direct" || trace.payload?.name === "ext_cancellation_direct",
    // ============================================================================
    // INITIALIZE REUSABLE CAL.COM UTILITY
    // ============================================================================
    initializeCalComUtility(config) {
        if (!this.calComUtility) {
            this.calComUtility = new CalComBaseUtility({
                apiKey: config.apiKey,
                logPrefix: "❌ CancellationDirect",
                enableLogging: config.enableDetailedLogging !== false,
                errorMessages: {
                    // Custom error messages for cancellation
                    missingReason: "Cancellation reason is required",
                    cancellationFailed: "Failed to cancel booking"
                }
            });
        } else {
            // Update API key if provided
            if (config.apiKey) {
                this.calComUtility.setApiKey(config.apiKey);
            }
        }
        return this.calComUtility;
    },
    render: async ({
        trace,
        element
    }) => {
        // ============================================================================
        // EXTRACT ALL PAYLOAD DATA INTO VARIABLES USING DESTRUCTURING
        // ============================================================================
        let {
            language = "fr",
                vf,
                apiKey = CONFIG.DEFAULT_API_KEY,
                uid = "",
                email = "",
                serviceProvider = "Dr. Sophie Martin",
                startTime = "",
                eventTypeSlug = "",
                timezone = "America/Toronto",
                voiceflowEnabled = true,
                voiceflowDataTransformer = null,
                enableDetailedLogging = true,
                logPrefix = "❌ CancellationDirect",
                enableSessionTimeout = true,
                sessionTimeout = CONFIG.SESSION_TIMEOUT,
                sessionWarning = CONFIG.SESSION_WARNING,
                cssUrls = CONFIG.DEFAULT_CSS,
                formType = "cancellation",
                formStructure = "single",
                useStructuredData = true,
                dataTransformer = BaseDataTransformer
        } = trace.payload || {};
        // Extract cancellation details from extracted variables
        const cancellationData = {
            uid: uid,
            email: email,
            serviceProvider: serviceProvider,
            startTime: startTime,
            eventTypeSlug: eventTypeSlug
        };
        // Initialize Cal.com utility using extracted variables
        const calComUtility = CancellationDirectExtension.initializeCalComUtility({
            apiKey: apiKey,
            enableDetailedLogging: enableDetailedLogging
        });
        // Helper function to get translated text
        const getTranslatedText = (key, lang = language) => {
            const keys = key.split('.');
            let value = CancellationDirectExtension.FORM_DATA.translations[lang];
            for (const k of keys) {
                value = value?.[k];
            }
            return value || key;
        };
        // Get service name for display using utility
        const serviceName = calComUtility.getServiceName(
            cancellationData.eventTypeSlug,
            cancellationData.serviceProvider,
            CancellationDirectExtension.FORM_DATA.serviceMapping
        );
        // Clone the form config and populate variables dynamically
        const formConfig = JSON.parse(JSON.stringify(CancellationDirectExtension.FORM_CONFIG));
        // Populate booking cancellation card field
        const bookingCardField = formConfig.steps[0].fields[0];
        bookingCardField.serviceProvider = cancellationData.serviceProvider;
        bookingCardField.startTime = cancellationData.startTime;
        bookingCardField.serviceName = serviceName;
        bookingCardField.eventTypeSlug = cancellationData.eventTypeSlug;
        bookingCardField.language = language;
        bookingCardField.uid = cancellationData.uid;
        bookingCardField.email = cancellationData.email;
        bookingCardField.translations = CancellationDirectExtension.FORM_DATA.translations;
        bookingCardField.serviceMapping = CancellationDirectExtension.FORM_DATA.serviceMapping;
        // Populate textarea field with translations
        const textareaField = formConfig.steps[0].fields[1];
        textareaField.placeholder = getTranslatedText('fields.cancellationReasonPlaceholder');
        textareaField.customErrorMessage = getTranslatedText('errors.reasonRequired');
        textareaField.customErrorMessages = {
            required: getTranslatedText('errors.reasonRequired')
        };
        // ============================================================================
        // DRAMATICALLY SIMPLIFIED: Uses generic FormDataProcessor and BaseDataTransformer
        // Same structure as SubmissionFormExtension
        // ============================================================================
        // Create the form with the new generic architecture using extracted variables
        const extension = new CreatForm({
                language: language,
                formType: formType,
                formStructure: formStructure,
                // ============================================================================
                // NEW: Generic approach - no specific field transformers needed!
                // BaseDataTransformer + FormDataProcessor handle everything automatically
                // ============================================================================
                useStructuredData: useStructuredData,
                dataTransformer: dataTransformer, // Generic transformer works with any form!
                // DISABLED: Webhook integration for cancellation forms
                webhookEnabled: false,
                webhookUrl: null,
                // ENABLED: Voiceflow integration with optional custom transformer
                voiceflowEnabled: voiceflowEnabled,
                voiceflowDataTransformer: voiceflowDataTransformer,
                // Enhanced logging using extracted variables
                enableDetailedLogging: enableDetailedLogging,
                logPrefix: logPrefix,
                // Session management using extracted variables
                enableSessionTimeout: enableSessionTimeout,
                sessionTimeout: sessionTimeout,
                sessionWarning: sessionWarning,
                // Cal.com specific configuration using extracted variables
                apiKey: apiKey,
                timezone: timezone,
                serviceProvider: cancellationData.serviceProvider,
                uid: cancellationData.uid,
                email: cancellationData.email,
                startTime: cancellationData.startTime,
                eventTypeSlug: cancellationData.eventTypeSlug,
                // ============================================================================
                // SIMPLIFIED: Just use the utility's handleCancellation method!
                // ============================================================================
                onSubmit: async (formData) => {
                    return await calComUtility.handleCancellation(formData, {
                        language: language,
                        uid: cancellationData.uid,
                        apiKey: apiKey,
                        serviceProvider: cancellationData.serviceProvider,
                        startTime: cancellationData.startTime,
                        eventTypeSlug: cancellationData.eventTypeSlug,
                        email: cancellationData.email,
                        voiceflowEnabled: voiceflowEnabled,
                        formVersion: CONFIG.FORM_VERSION
                    });
                },
                // CSS configuration using extracted variables
                cssUrls: cssUrls
            },
            CancellationDirectExtension.FORM_DATA,
            formConfig
        );
        // ============================================================================
        // SIMPLIFIED: Just use the utility's loadAndPopulateBookingData method!
        // ============================================================================
        await calComUtility.loadAndPopulateBookingData(extension, {
            uid: cancellationData.uid,
            apiKey: apiKey,
            language: language,
            serviceProvider: cancellationData.serviceProvider,
            eventTypeSlug: cancellationData.eventTypeSlug,
            email: cancellationData.email,
            startTime: cancellationData.startTime
        });
        return await extension.render(element);
    },
    // ============================================================================
    // FORM DATA CONFIGURATION - Same as before, no changes needed
    // ============================================================================
    FORM_DATA: {
        serviceMapping: {
            'nettoyages-et-examens-dentaires': 'Nettoyages et examens dentaires',
            'consultation-dentaire': 'Consultation dentaire',
            'chirurgie-dentaire': 'Chirurgie dentaire',
            'orthodontie': 'Orthodontie',
            'implants-dentaires': 'Implants dentaires',
            'blanchiment-dentaire': 'Blanchiment dentaire',
            'discovery-call-15-minutes': 'Entretien Exploratoire',
            'demonstration-chatbot-15min': 'Démonstration de l\'Agent IA',
            'reunion-45min': 'Présentation Détaillée',
            'reunion-projet': 'Session de Travail'
        },
        translations: {
            fr: {
                nav: {
                    next: "Suivant",
                    previous: "Précédent",
                    submit: "Annuler le rendez-vous",
                    processing: "Annulation en cours..."
                },
                common: {
                    yes: "Oui",
                    no: "Non",
                    other: "Autre",
                    required: "requis",
                    fieldRequired: "Ce champ est requis",
                    edit: "Modifier",
                    notSpecified: "Non spécifié",
                    none: "Aucun",
                    pleaseSpecify: "Veuillez préciser...",
                    selectAtLeastOne: "Veuillez sélectionner au moins une option"
                },
                labels: {
                    serviceProvider: "Prestataire de service",
                    bookingToCancel: "Rendez-vous à annuler",
                    cancellationDetails: "Détails de l'annulation"
                },
                placeholders: {
                    cancellationReason: "Pourquoi souhaitez-vous annuler ce rendez-vous ?"
                },
                steps: [
                    {
                        title: "Annuler Votre Rendez-vous",
                        desc: "Consultez les informations de votre rendez-vous et indiquez la raison de l'annulation"
                    }
                        ],
                fields: {
                    bookingToCancel: "Rendez-vous à Annuler",
                    scheduledWith: "Programmé avec",
                    currentDateTime: "Date et heure",
                    serviceName: "Service",
                    bookingNumber: "Numéro de Réservation",
                    status: "Statut",
                    confirmed: "Confirmé",
                    attendee: "Participant",
                    email: "Courriel",
                    cancellationReason: "Raison de l'annulation",
                    cancellationReasonPlaceholder: "Pourquoi souhaitez-vous annuler ce rendez-vous ?"
                },
                errors: {
                    reasonRequired: "Veuillez indiquer la raison de l'annulation",
                    cancellationError: "Erreur lors de l'annulation. Veuillez réessayer."
                },
                success: {
                    title: "Rendez-vous annulé !",
                    message: "Votre rendez-vous a été annulé avec succès. Vous recevrez sous peu un email de confirmation."
                }
            },
            en: {
                nav: {
                    next: "Next",
                    previous: "Previous",
                    submit: "Cancel Appointment",
                    processing: "Cancelling..."
                },
                common: {
                    yes: "Yes",
                    no: "No",
                    other: "Other",
                    required: "required",
                    fieldRequired: "This field is required",
                    edit: "Edit",
                    notSpecified: "Not specified",
                    none: "None",
                    pleaseSpecify: "Please specify...",
                    selectAtLeastOne: "Please select at least one option"
                },
                labels: {
                    serviceProvider: "Service Provider",
                    bookingToCancel: "Appointment to Cancel",
                    cancellationDetails: "Cancellation Details"
                },
                placeholders: {
                    cancellationReason: "Why do you want to cancel this appointment?"
                },
                steps: [
                    {
                        title: "Cancel Your Appointment",
                        desc: "Review your appointment information and provide a reason for cancellation"
                    }
                        ],
                fields: {
                    bookingToCancel: "Appointment to Cancel",
                    scheduledWith: "Scheduled with",
                    currentDateTime: "Date and time",
                    serviceName: "Service",
                    bookingNumber: "Booking Number",
                    status: "Status",
                    confirmed: "Confirmed",
                    attendee: "Attendee",
                    email: "Email",
                    cancellationReason: "Reason for cancellation",
                    cancellationReasonPlaceholder: "Why do you want to cancel this appointment?"
                },
                errors: {
                    reasonRequired: "Please provide a reason for cancellation",
                    cancellationError: "Cancellation error. Please try again."
                },
                success: {
                    title: "Appointment Cancelled!",
                    message: "Your appointment has been successfully cancelled. You will receive a confirmation email shortly."
                }
            }
        }
    },
    // ============================================================================
    // FORM CONFIGURATION - Same as before, no changes needed
    // ============================================================================
    FORM_CONFIG: {
        steps: [
            {
                sectionId: "cancellation_details", // NEW: Explicit section ID for generic processing
                fields: [
                    {
                        type: 'booking-cancellation-card',
                        id: 'currentAppointmentDisplay',
                        required: false,
                        serviceProvider: '{{serviceProvider}}',
                        startTime: '{{startTime}}',
                        serviceName: '{{serviceName}}',
                        eventTypeSlug: '{{eventTypeSlug}}',
                        language: '{{language}}',
                        uid: '{{uid}}',
                        email: '{{email}}',
                        cardStyle: 'default',
                        iconType: 'calendar',
                        showServiceName: true,
                        showDateTime: true,
                        showProvider: true,
                        showBookingInfo: true,
                        showAttendeeInfo: true,
                        translations: '{{translations}}',
                        serviceMapping: '{{serviceMapping}}'
                            },
                    {
                        type: 'textarea',
                        id: 'cancellationReason',
                        required: true,
                        row: 'cancellationReason',
                        rows: 4,
                        maxLength: 500,
                        showCounter: true,
                        placeholder: '{{placeholder}}',
                        getCustomErrorMessage: (lang) => CancellationDirectExtension.FORM_DATA.translations[lang].errors.reasonRequired
                            }
                        ]
                    }
                ]
    }
};
// ============================================================================
// ENHANCED CONTACT FORM EXTENSION - REWRITTEN WITH GENERIC APPROACH
// ============================================================================
const ContactFormExtension = {
    name: "ContactForm",
    type: "response",
    match: ({
        trace
    }) => trace.type === "ext_contact_form" || trace.payload?.name === "ext_contact_form",
    render: async ({
        trace,
        element
    }) => {
        // ============================================================================
        // EXTRACT ALL PAYLOAD DATA INTO VARIABLES USING DESTRUCTURING
        // Following the improved pattern from SubmissionFormExtension
        // ============================================================================
        let {
            language = "fr",
                vf,
                webhookEnabled = true,
                webhookUrl = CONFIG.DEFAULT_WEBHOOK,
                voiceflowEnabled = true,
                voiceflowDataTransformer = null,
                enableDetailedLogging = true,
                logPrefix = "📞 ContactForm",
                enableSessionTimeout = true,
                sessionTimeout = CONFIG.SESSION_TIMEOUT,
                sessionWarning = CONFIG.SESSION_WARNING,
                cssUrls = CONFIG.DEFAULT_CSS,
                formType = "contact",
                formStructure = "multistep",
                useStructuredData = true,
                dataTransformer = BaseDataTransformer
        } = trace.payload || {};
        // Helper function to get translated text
        const getTranslatedText = (key, lang = language) => {
            const keys = key.split('.');
            let value = ContactFormExtension.FORM_DATA.translations[lang];
            for (const k of keys) {
                value = value?.[k];
            }
            return value || key;
        };
        // ============================================================================
        // DRAMATICALLY SIMPLIFIED: No more specific field transformers!
        // Uses generic FormDataProcessor and BaseDataTransformer
        // Following the same pattern as SubmissionFormExtension
        // ============================================================================
        // Create the form with the new generic architecture using extracted variables
        const extension = new CreatForm({
                language: language,
                formType: formType,
                formStructure: formStructure,
                // ============================================================================
                // NEW: Generic approach - no specific field transformers needed!
                // BaseDataTransformer + FormDataProcessor handle everything automatically
                // ============================================================================
                useStructuredData: useStructuredData,
                dataTransformer: dataTransformer, // Generic transformer works with any form!
                // ENABLED: Webhook integration using extracted variables
                webhookEnabled: webhookEnabled,
                webhookUrl: webhookUrl,
                // ENABLED: Voiceflow integration with optional custom transformer
                voiceflowEnabled: voiceflowEnabled,
                voiceflowDataTransformer: voiceflowDataTransformer,
                // Enhanced logging using extracted variables
                enableDetailedLogging: enableDetailedLogging,
                logPrefix: logPrefix,
                // Session management using extracted variables
                enableSessionTimeout: enableSessionTimeout,
                sessionTimeout: sessionTimeout,
                sessionWarning: sessionWarning,
                // CSS configuration using extracted variables
                cssUrls: cssUrls
            },
            ContactFormExtension.FORM_DATA,
            ContactFormExtension.FORM_CONFIG, {
                DEFAULT_WEBHOOK: CONFIG.DEFAULT_WEBHOOK,
                DEFAULT_CSS: CONFIG.DEFAULT_CSS,
                SESSION_TIMEOUT: CONFIG.SESSION_TIMEOUT,
                SESSION_WARNING: CONFIG.SESSION_WARNING,
                DEBOUNCE_DELAY: CONFIG.DEBOUNCE_DELAY,
                FORM_VERSION: CONFIG.FORM_VERSION
            }
        );
        return await extension.render(element);
    },
    // ============================================================================
    // FORM DATA CONFIGURATION - Complete options and translations
    // ============================================================================
    FORM_DATA: {
        options: {
            agents: [
                {
                    id: "No Preference",
                    name: {
                        fr: "Pas de préférence",
                        en: "No Preference"
                    }
                },
                {
                    id: "Emma Thompson",
                    name: "Emma Thompson"
                },
                {
                    id: "Liam Carter",
                    name: "Liam Carter"
                },
                {
                    id: "Sophia Martinez",
                    name: "Sophia Martinez"
                },
                {
                    id: "Ethan Brown",
                    name: "Ethan Brown"
                },
                {
                    id: "Olivia Davis",
                    name: "Olivia Davis"
                },
                {
                    id: "Noah Wilson",
                    name: "Noah Wilson"
                },
                {
                    id: "Ava Johnson",
                    name: "Ava Johnson"
                }
            ],
            services: [
                {
                    id: "Ventes",
                    name: {
                        fr: "Ventes",
                        en: "Sell"
                    }
                },
                {
                    id: "Achat",
                    name: {
                        fr: "Achat",
                        en: "Buy"
                    }
                },
                {
                    id: "Information",
                    name: {
                        fr: "Information",
                        en: "Information"
                    }
                }
            ]
        },
        translations: {
            fr: {
                nav: {
                    next: "Suivant",
                    previous: "Précédent",
                    submit: "Envoyer",
                    processing: "Traitement..."
                },
                common: {
                    yes: "Oui",
                    no: "Non",
                    other: "Autre",
                    required: "requis",
                    fieldRequired: "Ce champ est requis",
                    edit: "Modifier",
                    notSpecified: "Non spécifié",
                    none: "Aucun",
                    pleaseSpecify: "Veuillez préciser...",
                    selectAtLeastOne: "Veuillez sélectionner au moins une option"
                },
                steps: [
                    {
                        title: "Contact",
                        desc: "Vos informations de contact"
                    },
                    {
                        title: "Agent & Service",
                        desc: "Sélection de l'agent et du service"
                    },
                    {
                        title: "Message",
                        desc: "Détails de votre message"
                    },
                    {
                        title: "Résumé",
                        desc: "Vérifiez vos informations avant envoi"
                    }
                ],
                fields: {
                    fullName: "Nom complet",
                    email: "Email",
                    phone: "Numéro de téléphone",
                    agent: "Sélectionnez un agent",
                    service: "Sélectionnez un service",
                    message: "Message"
                },
                placeholders: {
                    fullName: "Entrez votre nom complet",
                    email: "Entrez votre adresse email",
                    phone: "Entrez votre numéro de téléphone",
                    agent: "-- Sélectionnez un agent --",
                    service: "-- Sélectionnez un service --",
                    message: "Écrivez votre message ici..."
                },
                errors: {
                    fullName: "Le nom complet est obligatoire",
                    email: "Une adresse email valide est obligatoire",
                    emailInvalid: "Le format de l'adresse email n'est pas valide",
                    phone: "Un numéro de téléphone valide est obligatoire",
                    phoneInvalid: "Le format du numéro de téléphone n'est pas valide",
                    agent: "Vous devez sélectionner un agent",
                    service: "Vous devez sélectionner un service",
                    message: "Un message est obligatoire",
                    selectAtLeastOne: "Veuillez sélectionner au moins une option"
                },
                success: {
                    title: "Message envoyé avec succès !",
                    message: "Votre message a été envoyé avec succès. Notre équipe vous contactera bientôt."
                },
                summary: {
                    title: "Vérifiez vos informations",
                    description: "Vérifiez vos informations avant l'envoi final.",
                    editStep: "Modifier cette étape",
                    contact: "Contact",
                    agentService: "Agent & Service",
                    messageDetails: "Détails du message",
                    fullName: "Nom complet",
                    email: "Email",
                    phone: "Téléphone",
                    agent: "Agent",
                    service: "Service",
                    message: "Message",
                    noDataProvided: "Aucune donnée fournie pour cette section"
                }
            },
            en: {
                nav: {
                    next: "Next",
                    previous: "Previous",
                    submit: "Submit",
                    processing: "Processing..."
                },
                common: {
                    yes: "Yes",
                    no: "No",
                    other: "Other",
                    required: "required",
                    fieldRequired: "This field is required",
                    edit: "Edit",
                    notSpecified: "Not specified",
                    none: "None",
                    pleaseSpecify: "Please specify...",
                    selectAtLeastOne: "Please select at least one option"
                },
                steps: [
                    {
                        title: "Contact",
                        desc: "Your contact information"
                    },
                    {
                        title: "Agent & Service",
                        desc: "Agent and service selection"
                    },
                    {
                        title: "Message",
                        desc: "Your message details"
                    },
                    {
                        title: "Summary",
                        desc: "Review your information before submission"
                    }
                ],
                fields: {
                    fullName: "Full Name",
                    email: "Email",
                    phone: "Phone Number",
                    agent: "Select an Agent",
                    service: "Select a Service",
                    message: "Message"
                },
                placeholders: {
                    fullName: "Enter your full name",
                    email: "Enter your email address",
                    phone: "Enter your phone number",
                    agent: "-- Select an Agent --",
                    service: "-- Select a Service --",
                    message: "Write your message here..."
                },
                errors: {
                    fullName: "Full Name is required",
                    email: "A valid email is required",
                    emailInvalid: "Email format is not valid",
                    phone: "A valid phone number is required",
                    phoneInvalid: "Phone number format is not valid",
                    agent: "You must select an agent",
                    service: "You must select a service",
                    message: "A message is required",
                    selectAtLeastOne: "Please select at least one option"
                },
                success: {
                    title: "Message Sent Successfully!",
                    message: "Your message has been sent successfully. Our team will contact you soon."
                },
                summary: {
                    title: "Review Your Information",
                    description: "Review your information before final submission.",
                    editStep: "Edit this step",
                    contact: "Contact",
                    agentService: "Agent & Service",
                    messageDetails: "Message Details",
                    fullName: "Full Name",
                    email: "Email",
                    phone: "Phone",
                    agent: "Agent",
                    service: "Service",
                    message: "Message",
                    noDataProvided: "No data provided for this section"
                }
            }
        }
    },
    // ============================================================================
    // FORM CONFIGURATION - Field definitions and step structure
    // ============================================================================
    FORM_CONFIG: {
        steps: [
            // Step 1: Contact Information
            {
                sectionId: "contact_information", // NEW: Explicit section ID for generic processing
                fields: [
                    {
                        type: 'text',
                        id: 'fullName',
                        required: true,
                        row: 'name',
                        getCustomErrorMessage: (lang) => ContactFormExtension.FORM_DATA.translations[lang].errors.fullName,
                        getPlaceholder: (lang) => ContactFormExtension.FORM_DATA.translations[lang].placeholders.fullName
                    },
                    {
                        type: 'email',
                        id: 'email',
                        required: true,
                        row: 'contact',
                        getCustomErrorMessage: (lang) => ContactFormExtension.FORM_DATA.translations[lang].errors.email,
                        getCustomErrorMessages: (lang) => ({
                            required: ContactFormExtension.FORM_DATA.translations[lang].errors.email,
                            invalid: ContactFormExtension.FORM_DATA.translations[lang].errors.emailInvalid
                        }),
                        getPlaceholder: (lang) => ContactFormExtension.FORM_DATA.translations[lang].placeholders.email
                    },
                    {
                        type: 'phone',
                        id: 'phone',
                        required: true,
                        row: 'contact',
                        getCustomErrorMessage: (lang) => ContactFormExtension.FORM_DATA.translations[lang].errors.phone,
                        getCustomErrorMessages: (lang) => ({
                            required: ContactFormExtension.FORM_DATA.translations[lang].errors.phone,
                            phone: ContactFormExtension.FORM_DATA.translations[lang].errors.phoneInvalid
                        }),
                        getPlaceholder: (lang) => ContactFormExtension.FORM_DATA.translations[lang].placeholders.phone
                    }
                ]
            },

            // Step 2: Agent & Service Selection
            {
                sectionId: "agent_service_selection", // NEW: Explicit section ID
                fields: [
                    {
                        type: 'select',
                        id: 'agent',
                        required: true,
                        options: 'agents',
                        row: 'agent',
                        getCustomErrorMessage: (lang) => ContactFormExtension.FORM_DATA.translations[lang].errors.agent,
                        getPlaceholder: (lang) => ContactFormExtension.FORM_DATA.translations[lang].placeholders.agent
                    },
                    {
                        type: 'select',
                        id: 'service',
                        required: true,
                        options: 'services',
                        row: 'service',
                        getCustomErrorMessage: (lang) => ContactFormExtension.FORM_DATA.translations[lang].errors.service,
                        getPlaceholder: (lang) => ContactFormExtension.FORM_DATA.translations[lang].placeholders.service
                    }
                ]
            },

            // Step 3: Message Details
            {
                sectionId: "message_details", // NEW: Explicit section ID
                fields: [
                    {
                        type: 'textarea',
                        id: 'message',
                        required: true,
                        maxLength: 1000,
                        rows: 6,
                        row: 'message',
                        getCustomErrorMessage: (lang) => ContactFormExtension.FORM_DATA.translations[lang].errors.message,
                        getPlaceholder: (lang) => ContactFormExtension.FORM_DATA.translations[lang].placeholders.message
                    }
                ]
            },

            // Step 4: Contact Summary
            {
                sectionId: "contact_summary", // NEW: Explicit section ID
                fields: [
                    {
                        type: 'custom',
                        id: 'summary',
                        name: 'summary',
                        autoSummary: true,
                        getSummaryData: true,
                        label: ''
                    }
                ]
            }
        ]
    }
};
// ============================================================================
// SETUP AND INITIALIZATION
// ============================================================================
// Set up extension for global access
window.PropertySearchFormExtension = PropertySearchFormExtension;
window.ImageExtension = ImageExtension;
window.LocalisationExtension = LocalisationExtension;
window.CombinedCalculatorsExtension = CombinedCalculatorsExtension;
window.PropertySellFormExtension = PropertySellFormExtension;
window.BookingCalendarExtension = BookingCalendarExtension;
window.RescheduleCalendarExtension = RescheduleCalendarExtension;
window.CancellationDirectExtension = CancellationDirectExtension;
window.ContactFormExtension = ContactFormExtension;
