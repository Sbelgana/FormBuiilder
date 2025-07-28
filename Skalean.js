// ============================================================================
// CONFIGURATION CONSTANTS
// ============================================================================
const CONFIG = {
    DEFAULT_WEBHOOK: "",
    DEFAULT_API_KEY: "",
    DEFAULT_CSS: ['https://cdn.jsdelivr.net/gh/Sbelgana/AI_NextGen@4553cdc/FormFields.css'],
    SESSION_TIMEOUT: 900000, // 15 minutes
    SESSION_WARNING: 780000, // 13 minutes
    DEBOUNCE_DELAY: 50,
    FORM_VERSION: '5.0.0'
};
// ============================================================================
// SUBMISSION FORM EXTENSION 
// ============================================================================
const SubmissionFormExtension = {
    name: "GenericChatbotForm",
    type: "response",
    match: ({
        trace
    }) => trace.type === "ext_submission_form" || trace.payload?.name === "ext_submission_form",
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
                webhookEnabled = true,
                webhookUrl = CONFIG.DEFAULT_WEBHOOK,
                voiceflowEnabled = true,
                voiceflowDataTransformer = null,
                enableDetailedLogging = true,
                logPrefix = "📋 GenericForm",
                enableSessionTimeout = true,
                sessionTimeout = CONFIG.SESSION_TIMEOUT,
                sessionWarning = CONFIG.SESSION_WARNING,
                cssUrls = CONFIG.DEFAULT_CSS,
                formType = "submission",
                formStructure = "multistep",
                useStructuredData = true,
                dataTransformer = BaseDataTransformer
        } = trace.payload;
        // Helper function to get translated text
        const getTranslatedText = (key, lang = language) => {
            const keys = key.split('.');
            let value = SubmissionFormExtension.FORM_DATA.translations[lang];
            for (const k of keys) {
                value = value?.[k];
            }
            return value || key;
        };
        // ============================================================================
        // DRAMATICALLY SIMPLIFIED: No more flatData or specific field transformers!
        // Uses generic FormDataProcessor and BaseDataTransformer
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
            SubmissionFormExtension.FORM_DATA,
            SubmissionFormExtension.FORM_CONFIG
        );
        return await extension.render(element);
    },
    // ============================================================================
    // FORM DATA CONFIGURATION - Complete options and translations (unchanged)
    // ============================================================================
    FORM_DATA: {
        options: {
            languages: [
                {
                    id: "fr",
                    name: "Français"
                },
                {
                    id: "en",
                    name: "English"
                },
                {
                    id: "es",
                    name: "Español"
                },
                {
                    id: "de",
                    name: "Deutsch"
                },
                {
                    id: "it",
                    name: "Italiano"
                },
                {
                    id: "ar",
                    name: "العربية"
                },
                {
                    id: "zh",
                    name: "中文"
                },
                {
                    id: "pt",
                    name: "Português"
                },
                {
                    id: "ru",
                    name: "Русский"
                },
                {
                    id: "ja",
                    name: "日本語"
                }
            ],
            niches: [
                {
                    id: "ecommerce",
                    name: {
                        fr: "E-commerce",
                        en: "E-commerce"
                    }
                },
                {
                    id: "services",
                    name: {
                        fr: "Services professionnels",
                        en: "Professional Services"
                    }
                },
                {
                    id: "healthcare",
                    name: {
                        fr: "Santé",
                        en: "Healthcare"
                    }
                },
                {
                    id: "education",
                    name: {
                        fr: "Éducation",
                        en: "Education"
                    }
                },
                {
                    id: "realestate",
                    name: {
                        fr: "Immobilier",
                        en: "Real Estate"
                    }
                },
                {
                    id: "restaurant",
                    name: {
                        fr: "Restauration",
                        en: "Restaurant & Food"
                    }
                },
                {
                    id: "fitness",
                    name: {
                        fr: "Fitness & Bien-être",
                        en: "Fitness & Wellness"
                    }
                },
                {
                    id: "travel",
                    name: {
                        fr: "Voyage & Tourisme",
                        en: "Travel & Tourism"
                    }
                },
                {
                    id: "finance",
                    name: {
                        fr: "Finance & Assurance",
                        en: "Finance & Insurance"
                    }
                },
                {
                    id: "manufacturing",
                    name: {
                        fr: "Industrie manufacturière",
                        en: "Manufacturing"
                    }
                },
                {
                    id: "automotive",
                    name: {
                        fr: "Automobile",
                        en: "Automotive"
                    }
                },
                {
                    id: "legal",
                    name: {
                        fr: "Services juridiques",
                        en: "Legal Services"
                    }
                },
                {
                    id: "technology",
                    name: {
                        fr: "IT & Technologie",
                        en: "IT & Technology"
                    }
                },
                {
                    id: "consulting",
                    name: {
                        fr: "Conseil & Consulting",
                        en: "Consulting"
                    }
                },
                {
                    id: "retail",
                    name: {
                        fr: "Commerce de détail",
                        en: "Retail"
                    }
                }
            ],
            budgetRanges: [
                {
                    id: "less_than_1000",
                    name: {
                        fr: "Moins de 1 000 $",
                        en: "Less than $1,000"
                    }
                },
                {
                    id: "1000_2500",
                    name: {
                        fr: "1 000 $ - 2 500 $",
                        en: "$1,000 - $2,500"
                    }
                },
                {
                    id: "2500_5000",
                    name: {
                        fr: "2 500 $ - 5 000 $",
                        en: "$2,500 - $5,000"
                    }
                },
                {
                    id: "5000_7500",
                    name: {
                        fr: "5 000 $ - 7 500 $",
                        en: "$5,000 - $7,500"
                    }
                },
                {
                    id: "7500_10000",
                    name: {
                        fr: "7 500 $ - 10 000 $",
                        en: "$7,500 - $10,000"
                    }
                },
                {
                    id: "more_than_10000",
                    name: {
                        fr: "Plus de 10 000 $",
                        en: "More than $10,000"
                    }
                },
                {
                    id: "custom",
                    name: {
                        fr: "Personnalisé",
                        en: "Custom"
                    }
                },
                {
                    id: "not_specified",
                    name: {
                        fr: "Budget non défini",
                        en: "Budget not defined"
                    }
                }
            ],
            formTypes: [
                {
                    id: "contact",
                    name: {
                        fr: "Formulaire de contact",
                        en: "Contact Form"
                    }
                },
                {
                    id: "lead",
                    name: {
                        fr: "Génération de leads",
                        en: "Lead Generation"
                    }
                },
                {
                    id: "survey",
                    name: {
                        fr: "Questionnaire",
                        en: "Survey"
                    }
                },
                {
                    id: "booking",
                    name: {
                        fr: "Réservation",
                        en: "Booking"
                    }
                },
                {
                    id: "support",
                    name: {
                        fr: "Support client",
                        en: "Customer Support"
                    }
                },
                {
                    id: "feedback",
                    name: {
                        fr: "Feedback client",
                        en: "Customer Feedback"
                    }
                },
                {
                    id: "quote",
                    name: {
                        fr: "Demande de devis",
                        en: "Quote Request"
                    }
                },
                {
                    id: "registration",
                    name: {
                        fr: "Inscription/Enregistrement",
                        en: "Registration"
                    }
                },
                {
                    id: "newsletter",
                    name: {
                        fr: "Abonnement newsletter",
                        en: "Newsletter Signup"
                    }
                },
                {
                    id: "appointment",
                    name: {
                        fr: "Prise de rendez-vous",
                        en: "Appointment Scheduling"
                    }
                }
            ],
            platforms: {
                website: [
                    {
                        id: "wordpress",
                        name: "WordPress"
                    },
                    {
                        id: "shopify",
                        name: "Shopify"
                    },
                    {
                        id: "wix",
                        name: "Wix"
                    },
                    {
                        id: "squarespace",
                        name: "Squarespace"
                    },
                    {
                        id: "webflow",
                        name: "Webflow"
                    },
                    {
                        id: "drupal",
                        name: "Drupal"
                    },
                    {
                        id: "magento",
                        name: "Magento"
                    },
                    {
                        id: "custom",
                        name: {
                            fr: "Sur mesure",
                            en: "Custom"
                        }
                    }
                ],
                social: [
                    {
                        id: "facebook",
                        name: "Facebook Messenger"
                    },
                    {
                        id: "instagram",
                        name: "Instagram"
                    },
                    {
                        id: "whatsapp",
                        name: "WhatsApp"
                    },
                    {
                        id: "telegram",
                        name: "Telegram"
                    },
                    {
                        id: "discord",
                        name: "Discord"
                    },
                    {
                        id: "slack",
                        name: "Slack"
                    },
                    {
                        id: "teams",
                        name: "Microsoft Teams"
                    }
                ]
            },
            websiteTraffic: [
                {
                    id: "less_than_1000",
                    name: {
                        fr: "Moins de 1 000 visiteurs/mois",
                        en: "Less than 1,000 visitors/month"
                    }
                },
                {
                    id: "1000_5000",
                    name: {
                        fr: "1 000 - 5 000 visiteurs/mois",
                        en: "1,000 - 5,000 visitors/month"
                    }
                },
                {
                    id: "5000_10000",
                    name: {
                        fr: "5 000 - 10 000 visiteurs/mois",
                        en: "5,000 - 10,000 visitors/month"
                    }
                },
                {
                    id: "10000_50000",
                    name: {
                        fr: "10 000 - 50 000 visiteurs/mois",
                        en: "10,000 - 50,000 visitors/month"
                    }
                },
                {
                    id: "50000_100000",
                    name: {
                        fr: "50 000 - 100 000 visiteurs/mois",
                        en: "50,000 - 100,000 visitors/month"
                    }
                },
                {
                    id: "more_than_100000",
                    name: {
                        fr: "Plus de 100 000 visiteurs/mois",
                        en: "More than 100,000 visitors/month"
                    }
                },
                {
                    id: "unknown",
                    name: {
                        fr: "Je ne sais pas",
                        en: "I don't know"
                    }
                },
                {
                    id: "new_site",
                    name: {
                        fr: "Nouveau site",
                        en: "New site"
                    }
                }
            ],
            integrations: {
                crms: [
                    {
                        id: "salesforce",
                        name: "Salesforce"
                    },
                    {
                        id: "hubspot",
                        name: "HubSpot"
                    },
                    {
                        id: "zoho",
                        name: "Zoho CRM"
                    },
                    {
                        id: "pipedrive",
                        name: "Pipedrive"
                    },
                    {
                        id: "monday",
                        name: "monday.com"
                    },
                    {
                        id: "freshsales",
                        name: "Freshsales"
                    },
                    {
                        id: "dynamics",
                        name: "Microsoft Dynamics 365"
                    }
                ],
                booking: [
                    {
                        id: "cal",
                        name: "Cal.com"
                    },
                    {
                        id: "calendly",
                        name: "Calendly"
                    },
                    {
                        id: "acuity",
                        name: "Acuity Scheduling"
                    },
                    {
                        id: "booksy",
                        name: "Booksy"
                    },
                    {
                        id: "simplybook",
                        name: "SimplyBook.me"
                    },
                    {
                        id: "square",
                        name: "Square Appointments"
                    },
                    {
                        id: "google_calendar",
                        name: "Google Calendar"
                    }
                ],
                databases: [
                    {
                        id: "mysql",
                        name: "MySQL"
                    },
                    {
                        id: "postgresql",
                        name: "PostgreSQL"
                    },
                    {
                        id: "mongodb",
                        name: "MongoDB"
                    },
                    {
                        id: "firebase",
                        name: "Firebase"
                    },
                    {
                        id: "airtable",
                        name: "Airtable"
                    },
                    {
                        id: "google_sheets",
                        name: "Google Sheets"
                    }
                ]
            }
        },
        translations: {
            fr: {
                nav: {
                    next: "Suivant",
                    previous: "Précédent",
                    submit: "Soumettre votre projet",
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
                options: {
                    teamSize: {
                        solo: "Entrepreneur individuel",
                        small: "TPE (2-10 employés)",
                        medium: "PME (11-50 employés)",
                        large: "Grande entreprise (50+ employés)"
                    }
                },
                labels: {
                    otherLabel: "Autre",
                    customLabel: "Personnalisé",
                    otherType: "Autre type",
                    otherPlatform: "Autre plateforme",
                    otherCRM: "Autre CRM",
                    otherSystem: "Autre système",
                    otherDatabase: "Autre base de données"
                },
                placeholders: {
                    otherNiche: "Veuillez préciser votre secteur...",
                    customBudget: "Veuillez détailler votre budget...",
                    projectDescription: "Veuillez détailler vos objectifs, exigences et attentes spécifiques...",
                    services: "Détaillez vos offres de services et produits phares...",
                    formPurpose: "Précisez les objectifs et résultats attendus des formulaires...",
                    formType: "Précisez le type de formulaire...",
                    websiteUrl: "https://www.example.com",
                    otherPlatform: "Autre plateforme...",
                    crmName: "Nom du CRM...",
                    systemName: "Nom du système...",
                    databaseName: "Nom de la base de données..."
                },
                steps: [
                    {
                        title: "Coordonnées professionnelles",
                        desc: "Renseignez vos informations de contact"
                    },
                    {
                        title: "Spécifications du projet",
                        desc: "Détaillez votre projet"
                    },
                    {
                        title: "Profil d'entreprise",
                        desc: "Informations sur votre organisation"
                    },
                    {
                        title: "Fonctionnalités essentielles",
                        desc: "Fonctionnalités de base souhaitées"
                    },
                    {
                        title: "Intégration de formulaires",
                        desc: "Configuration des formulaires interactifs"
                    },
                    {
                        title: "Intégration Web",
                        desc: "Informations sur votre site web"
                    },
                    {
                        title: "Intégrations & API",
                        desc: "Intégrations avec vos outils existants"
                    },
                    {
                        title: "Canaux d'interaction",
                        desc: "Configuration des canaux de communication"
                    },
                    {
                        title: "Synthèse de votre projet",
                        desc: "Récapitulatif de votre demande"
                    }
                ],
                fields: {
                    firstName: "Prénom",
                    lastName: "Nom de famille",
                    email: "Adresse électronique",
                    phone: "Numéro de téléphone",
                    company: "Société/Organisation (optionnel)",
                    niche: "Quel est votre secteur d'activité ?",
                    budget: "Budget alloué au projet",
                    description: "Description exhaustive de votre projet",
                    teamSize: "Effectif de votre organisation",
                    services: "Services et produits proposés",
                    leadCapture: "Souhaitez-vous implémenter la capture de prospects ?",
                    leadQualification: "Nécessitez-vous un système de qualification des prospects ?",
                    conversationSummary: "Souhaitez-vous des synthèses automatiques de conversations ?",
                    useForm: "Souhaitez-vous intégrer des formulaires interactifs ?",
                    formTypes: "Types de formulaires à intégrer",
                    formPurpose: "Objectif et fonction des formulaires",
                    hasWebsite: "Disposez-vous d'un site web existant ?",
                    websitePlatform: "Plateforme de développement de votre site",
                    websiteUrl: "Adresse URL complète de votre site",
                    websiteTraffic: "Volume de trafic mensuel estimé",
                    useCRM: "Prévoyez-vous d'intégrer votre chatbot à un CRM ?",
                    crms: "CRM à connecter avec votre chatbot",
                    hasBookingSystem: "Disposez-vous d'un système de réservation à intégrer ?",
                    bookingSystems: "Système de réservation à connecter",
                    handleCancellation: "Souhaitez-vous que le chatbot gère les annulations et reports ?",
                    useDatabase: "Prévoyez-vous d'intégrer une base de données externe ?",
                    databases: "Bases de données à connecter",
                    wantBookingRecommendation: "Désirez-vous une recommandation pour un système de réservation adapté ?",
                    needSocialBot: "Souhaitez-vous déployer le chatbot sur les réseaux sociaux ?",
                    socialPlatforms: "Plateformes sociales à intégrer",
                    languageType: "Configuration linguistique du chatbot",
                    languages: "Langues à prendre en charge",
                    language: "Langue principale"
                },
                errors: {
                    firstName: "Veuillez saisir votre prénom",
                    lastName: "Veuillez saisir votre nom de famille",
                    email: "Veuillez saisir une adresse e-mail valide",
                    emailInvalid: "Le format de l'adresse e-mail n'est pas valide",
                    phone: "Veuillez saisir un numéro de téléphone valide",
                    phoneInvalid: "Le format du numéro de téléphone n'est pas valide",
                    niche: "Veuillez sélectionner votre secteur d'activité",
                    budget: "Veuillez indiquer votre budget",
                    description: "Veuillez décrire votre projet en détail",
                    teamSize: "Veuillez indiquer la taille de votre équipe",
                    services: "Veuillez décrire vos services et produits",
                    leadCapture: "Veuillez indiquer si vous souhaitez la capture de prospects",
                    leadQualification: "Veuillez indiquer si vous avez besoin de qualification des prospects",
                    conversationSummary: "Veuillez indiquer si vous souhaitez des synthèses automatiques",
                    useForm: "Veuillez indiquer si vous souhaitez intégrer des formulaires",
                    formTypes: "Veuillez sélectionner au moins un type de formulaire",
                    hasWebsite: "Veuillez indiquer si vous avez un site web",
                    websitePlatform: "Veuillez sélectionner votre plateforme web",
                    websiteUrl: "Veuillez saisir une URL valide",
                    urlInvalid: "Le format de l'URL n'est pas valide",
                    useCRM: "Veuillez indiquer si vous souhaitez intégrer un CRM",
                    crms: "Veuillez sélectionner au moins un CRM",
                    hasBookingSystem: "Veuillez indiquer si vous avez un système de réservation",
                    bookingSystems: "Veuillez sélectionner votre système de réservation",
                    useDatabase: "Veuillez indiquer si vous souhaitez intégrer une base de données",
                    databases: "Veuillez sélectionner au moins une base de données",
                    needSocialBot: "Veuillez indiquer si vous souhaitez déployer sur les réseaux sociaux",
                    socialPlatforms: "Veuillez sélectionner au moins une plateforme sociale",
                    languageType: "Veuillez choisir la configuration linguistique",
                    languages: "Veuillez sélectionner au moins une langue",
                    language: "Veuillez sélectionner une langue",
                    selectAtLeastOne: "Veuillez sélectionner au moins une option"
                },
                success: {
                    title: "Demande soumise avec succès !",
                    message: "Merci pour votre soumission. Notre équipe d'experts analysera votre projet et vous contactera prochainement."
                },
                summary: {
                    title: "Récapitulatif de votre projet",
                    description: "Vérifiez les informations saisies avant de soumettre votre demande.",
                    editStep: "Modifier cette étape",
                    noDataProvided: "Aucune donnée fournie pour cette section"
                }
            },
            en: {
                nav: {
                    next: "Next",
                    previous: "Previous",
                    submit: "Submit Your Project",
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
                options: {
                    teamSize: {
                        solo: "Individual Entrepreneur",
                        small: "Small Business (2-10 employees)",
                        medium: "Medium Business (11-50 employees)",
                        large: "Large Enterprise (50+ employees)"
                    }
                },
                labels: {
                    otherLabel: "Other",
                    customLabel: "Custom",
                    otherType: "Other type",
                    otherPlatform: "Other platform",
                    otherCRM: "Other CRM",
                    otherSystem: "Other system",
                    otherDatabase: "Other database"
                },
                placeholders: {
                    otherNiche: "Please specify your industry...",
                    customBudget: "Please detail your budget...",
                    projectDescription: "Please detail your objectives, requirements and specific expectations...",
                    services: "Detail your services and flagship products...",
                    formPurpose: "Specify the objectives and expected results of the forms...",
                    formType: "Specify the form type...",
                    websiteUrl: "https://www.example.com",
                    otherPlatform: "Other platform...",
                    crmName: "CRM name...",
                    systemName: "System name...",
                    databaseName: "Database name..."
                },
                steps: [
                    {
                        title: "Professional Contact Details",
                        desc: "Enter your contact information"
                    },
                    {
                        title: "Project Specifications",
                        desc: "Detail your project"
                    },
                    {
                        title: "Company Profile",
                        desc: "Information about your organization"
                    },
                    {
                        title: "Essential Features",
                        desc: "Desired core features"
                    },
                    {
                        title: "Form Integration",
                        desc: "Interactive forms configuration"
                    },
                    {
                        title: "Web Integration",
                        desc: "Information about your website"
                    },
                    {
                        title: "Integrations & APIs",
                        desc: "Integrations with your existing tools"
                    },
                    {
                        title: "Interaction Channels",
                        desc: "Communication channels configuration"
                    },
                    {
                        title: "Project Summary",
                        desc: "Summary of your request"
                    }
                ],
                fields: {
                    firstName: "First Name",
                    lastName: "Last Name",
                    email: "Email Address",
                    phone: "Phone Number",
                    company: "Company/Organization (optional)",
                    niche: "What is your industry sector?",
                    budget: "Project Budget Allocation",
                    description: "Comprehensive Project Description",
                    teamSize: "Organization Headcount",
                    services: "Services and Products Offered",
                    leadCapture: "Do you require prospect acquisition functionality?",
                    leadQualification: "Do you need a prospect qualification system?",
                    conversationSummary: "Would you like automated conversation synthesis?",
                    useForm: "Would you like to integrate interactive forms?",
                    formTypes: "Form Types to Integrate",
                    formPurpose: "Form Purpose and Function",
                    hasWebsite: "Do you have an existing website?",
                    websitePlatform: "Website Development Platform",
                    websiteUrl: "Complete URL of your website",
                    websiteTraffic: "Estimated Monthly Traffic Volume",
                    useCRM: "Do you plan to integrate your chatbot with a CRM?",
                    crms: "CRMs to Connect with Your Chatbot",
                    hasBookingSystem: "Do you have a booking system to integrate?",
                    bookingSystems: "Booking System to Connect",
                    handleCancellation: "Should the chatbot manage cancellations and rescheduling?",
                    useDatabase: "Do you plan to integrate an external database?",
                    databases: "Databases to Connect",
                    wantBookingRecommendation: "Would you like a recommendation for a suitable booking system?",
                    needSocialBot: "Would you like to deploy the chatbot on social media platforms?",
                    socialPlatforms: "Social Platforms to Integrate",
                    languageType: "Chatbot Language Configuration",
                    languages: "Languages to Support",
                    language: "Primary Language"
                },
                errors: {
                    firstName: "Please enter your first name",
                    lastName: "Please enter your last name",
                    email: "Please enter a valid email address",
                    emailInvalid: "Email format is not valid",
                    phone: "Please enter a valid phone number",
                    phoneInvalid: "Phone number format is not valid",
                    niche: "Please select your industry sector",
                    budget: "Please indicate your budget",
                    description: "Please describe your project in detail",
                    teamSize: "Please indicate your team size",
                    services: "Please describe your services and products",
                    leadCapture: "Please indicate if you want lead capture functionality",
                    leadQualification: "Please indicate if you need lead qualification",
                    conversationSummary: "Please indicate if you want automated summaries",
                    useForm: "Please indicate if you want to integrate forms",
                    formTypes: "Please select at least one form type",
                    hasWebsite: "Please indicate if you have a website",
                    websitePlatform: "Please select your web platform",
                    websiteUrl: "Please enter a valid URL",
                    urlInvalid: "URL format is not valid",
                    useCRM: "Please indicate if you want CRM integration",
                    crms: "Please select at least one CRM",
                    hasBookingSystem: "Please indicate if you have a booking system",
                    bookingSystems: "Please select your booking system",
                    useDatabase: "Please indicate if you want database integration",
                    databases: "Please select at least one database",
                    needSocialBot: "Please indicate if you want social media deployment",
                    socialPlatforms: "Please select at least one social platform",
                    languageType: "Please choose the language configuration",
                    languages: "Please select at least one language",
                    language: "Please select a language",
                    selectAtLeastOne: "Please select at least one option"
                },
                success: {
                    title: "Project Submitted Successfully!",
                    message: "Thank you for your submission. Our expert team will review your project and contact you shortly."
                },
                summary: {
                    title: "Project Summary",
                    description: "Please review the information provided before submitting your request.",
                    editStep: "Edit this step",
                    noDataProvided: "No data provided for this section"
                }
            }
        }
    },
    // ============================================================================
    // FORM CONFIGURATION - Field definitions and step structure (unchanged)
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
                        getCustomErrorMessage: (lang) => SubmissionFormExtension.FORM_DATA.translations[lang].errors.firstName
                    },
                    {
                        type: 'text',
                        id: 'lastName',
                        required: true,
                        row: 'name',
                        getCustomErrorMessage: (lang) => SubmissionFormExtension.FORM_DATA.translations[lang].errors.lastName
                    },
                    {
                        type: 'email',
                        id: 'email',
                        required: true,
                        row: 'contact',
                        getCustomErrorMessage: (lang) => SubmissionFormExtension.FORM_DATA.translations[lang].errors.email,
                        getCustomErrorMessages: (lang) => ({
                            required: SubmissionFormExtension.FORM_DATA.translations[lang].errors.email,
                            invalid: SubmissionFormExtension.FORM_DATA.translations[lang].errors.emailInvalid
                        })
                    },
                    {
                        type: 'phone',
                        id: 'phone',
                        required: true,
                        row: 'contact',
                        getCustomErrorMessage: (lang) => SubmissionFormExtension.FORM_DATA.translations[lang].errors.phone,
                        getCustomErrorMessages: (lang) => ({
                            required: SubmissionFormExtension.FORM_DATA.translations[lang].errors.phone,
                            phone: SubmissionFormExtension.FORM_DATA.translations[lang].errors.phoneInvalid
                        })
                    },
                    {
                        type: 'text',
                        id: 'company',
                        required: false,
                        row: 'organisation'
                    }
                ]
            },

            // Step 2: Project Specifications
            {
                sectionId: "project_specifications", // NEW: Explicit section ID
                fields: [
                    {
                        type: 'select-with-other',
                        id: 'niche',
                        required: true,
                        options: 'niches',
                        row: 'project-basics',
                        getOtherLabel: (lang) => SubmissionFormExtension.FORM_DATA.translations[lang].labels.otherLabel,
                        getOtherPlaceholder: (lang) => SubmissionFormExtension.FORM_DATA.translations[lang].placeholders.otherNiche,
                        getCustomErrorMessage: (lang) => SubmissionFormExtension.FORM_DATA.translations[lang].errors.niche
                    },
                    {
                        type: 'select-with-other',
                        id: 'budget',
                        required: true,
                        options: 'budgetRanges',
                        row: 'project-basics',
                        getOtherLabel: (lang) => SubmissionFormExtension.FORM_DATA.translations[lang].labels.customLabel,
                        getOtherPlaceholder: (lang) => SubmissionFormExtension.FORM_DATA.translations[lang].placeholders.customBudget,
                        getCustomErrorMessage: (lang) => SubmissionFormExtension.FORM_DATA.translations[lang].errors.budget
                    },
                    {
                        type: 'textarea',
                        id: 'description',
                        row: 'projetdesc',
                        required: true,
                        maxLength: 1000,
                        rows: 6,
                        getPlaceholder: (lang) => SubmissionFormExtension.FORM_DATA.translations[lang].placeholders.projectDescription,
                        getCustomErrorMessage: (lang) => SubmissionFormExtension.FORM_DATA.translations[lang].errors.description
                    }
                ]
            },

            // Step 3: Company Profile
            {
                sectionId: "business_profile", // NEW: Explicit section ID
                fields: [
                    {
                        type: 'select',
                        id: 'teamSize',
                        required: true,
                        row: 'entrepriseteamSize',
                        options: [
                            {
                                id: 'solo',
                                name: {
                                    fr: "Entrepreneur individuel",
                                    en: "Individual Entrepreneur"
                                }
                            },
                            {
                                id: 'small',
                                name: {
                                    fr: "TPE (2-10 employés)",
                                    en: "Small Business (2-10 employees)"
                                }
                            },
                            {
                                id: 'medium',
                                name: {
                                    fr: "PME (11-50 employés)",
                                    en: "Medium Business (11-50 employees)"
                                }
                            },
                            {
                                id: 'large',
                                name: {
                                    fr: "Grande entreprise (50+ employés)",
                                    en: "Large Enterprise (50+ employees)"
                                }
                            }
                        ],
                        getCustomErrorMessage: (lang) => SubmissionFormExtension.FORM_DATA.translations[lang].errors.teamSize
                    },
                    {
                        type: 'textarea',
                        id: 'services',
                        row: 'entreprisetextarea',
                        required: true,
                        maxLength: 500,
                        rows: 4,
                        getPlaceholder: (lang) => SubmissionFormExtension.FORM_DATA.translations[lang].placeholders.services,
                        getCustomErrorMessage: (lang) => SubmissionFormExtension.FORM_DATA.translations[lang].errors.services
                    }
                ]
            },

            // Step 4: Essential Features
            {
                sectionId: "core_features", // NEW: Explicit section ID
                fields: [
                    {
                        type: 'yesno',
                        id: 'leadCapture',
                        required: true,
                        getCustomErrorMessage: (lang) => SubmissionFormExtension.FORM_DATA.translations[lang].errors.leadCapture
                    },
                    {
                        type: 'yesno',
                        id: 'leadQualification',
                        required: true,
                        getCustomErrorMessage: (lang) => SubmissionFormExtension.FORM_DATA.translations[lang].errors.leadQualification
                    },
                    {
                        type: 'yesno',
                        id: 'conversationSummary',
                        required: true,
                        getCustomErrorMessage: (lang) => SubmissionFormExtension.FORM_DATA.translations[lang].errors.conversationSummary
                    }
                ]
            },

            // Step 5: Form Integration
            {
                sectionId: "form_integration", // NEW: Explicit section ID
                fields: [
                    {
                        type: 'yesno-with-options',
                        id: 'useForm',
                        required: true,
                        getCustomErrorMessage: (lang) => SubmissionFormExtension.FORM_DATA.translations[lang].errors.useForm,
                        yesFields: [
                            {
                                type: 'multiselect-with-other',
                                id: 'formTypes',
                                row: 'formTypes',
                                required: true,
                                options: 'formTypes',
                                getOtherLabel: (lang) => SubmissionFormExtension.FORM_DATA.translations[lang].labels.otherType,
                                getOtherPlaceholder: (lang) => SubmissionFormExtension.FORM_DATA.translations[lang].placeholders.formType,
                                getCustomErrorMessages: (lang) => ({
                                    selectAtLeastOne: SubmissionFormExtension.FORM_DATA.translations[lang].errors.formTypes
                                })
                            },
                            {
                                type: 'textarea',
                                id: 'formPurpose',
                                row: 'formPurpose',
                                required: false,
                                maxLength: 300,
                                rows: 3,
                                getPlaceholder: (lang) => SubmissionFormExtension.FORM_DATA.translations[lang].placeholders.formPurpose
                            }
                        ]
                    }
                ]
            },

            // Step 6: Website Integration
            {
                sectionId: "web_integration", // NEW: Explicit section ID
                fields: [
                    {
                        type: 'yesno-with-options',
                        id: 'hasWebsite',
                        required: true,
                        getCustomErrorMessage: (lang) => SubmissionFormExtension.FORM_DATA.translations[lang].errors.hasWebsite,
                        yesFields: [
                            {
                                type: 'select-with-other',
                                id: 'websitePlatform',
                                required: true,
                                options: 'platforms.website',
                                row: 'website-details',
                                getOtherLabel: (lang) => SubmissionFormExtension.FORM_DATA.translations[lang].labels.otherLabel,
                                getOtherPlaceholder: (lang) => SubmissionFormExtension.FORM_DATA.translations[lang].placeholders.otherPlatform,
                                getCustomErrorMessage: (lang) => SubmissionFormExtension.FORM_DATA.translations[lang].errors.websitePlatform
                            },
                            {
                                type: 'select',
                                id: 'websiteTraffic',
                                required: false,
                                options: 'websiteTraffic',
                                row: 'website-details'
                            },
                            {
                                type: 'url',
                                id: 'websiteUrl',
                                row: 'websiteUrl',
                                required: true,
                                getPlaceholder: (lang) => SubmissionFormExtension.FORM_DATA.translations[lang].placeholders.websiteUrl,
                                getCustomErrorMessages: (lang) => ({
                                    url: SubmissionFormExtension.FORM_DATA.translations[lang].errors.urlInvalid
                                })
                            }
                        ]
                    }
                ]
            },

            // Step 7: Integrations & APIs
            {
                sectionId: "integrations_apis", // NEW: Explicit section ID
                fields: [
                    {
                        type: 'yesno-with-options',
                        id: 'useCRM',
                        required: true,
                        getCustomErrorMessage: (lang) => SubmissionFormExtension.FORM_DATA.translations[lang].errors.useCRM,
                        yesField: {
                            type: 'multiselect-with-other',
                            id: 'crms',
                            row: 'CRMType',
                            required: true,
                            options: 'integrations.crms',
                            getOtherLabel: (lang) => SubmissionFormExtension.FORM_DATA.translations[lang].labels.otherCRM,
                            getOtherPlaceholder: (lang) => SubmissionFormExtension.FORM_DATA.translations[lang].placeholders.crmName,
                            getCustomErrorMessages: (lang) => ({
                                selectAtLeastOne: SubmissionFormExtension.FORM_DATA.translations[lang].errors.crms
                            })
                        }
                    },
                    {
                        type: 'yesno-with-options',
                        id: 'hasBookingSystem',
                        required: true,
                        getCustomErrorMessage: (lang) => SubmissionFormExtension.FORM_DATA.translations[lang].errors.hasBookingSystem,
                        yesField: {
                            type: 'select-with-other',
                            id: 'bookingSystems',
                            row: 'bookingSystems',
                            required: true,
                            options: 'integrations.booking',
                            getOtherLabel: (lang) => SubmissionFormExtension.FORM_DATA.translations[lang].labels.otherSystem,
                            getOtherPlaceholder: (lang) => SubmissionFormExtension.FORM_DATA.translations[lang].placeholders.systemName,
                            getCustomErrorMessage: (lang) => SubmissionFormExtension.FORM_DATA.translations[lang].errors.bookingSystems
                        },
                        noField: {
                            type: 'yesno',
                            id: 'wantBookingRecommendation',
                            required: false
                        }
                    },
                    {
                        type: 'yesno',
                        id: 'handleCancellation',
                        required: false
                    },
                    {
                        type: 'yesno-with-options',
                        id: 'useDatabase',
                        required: true,
                        getCustomErrorMessage: (lang) => SubmissionFormExtension.FORM_DATA.translations[lang].errors.useDatabase,
                        yesField: {
                            type: 'multiselect-with-other',
                            id: 'databases',
                            row: 'databases',
                            required: true,
                            options: 'integrations.databases',
                            getOtherLabel: (lang) => SubmissionFormExtension.FORM_DATA.translations[lang].labels.otherDatabase,
                            getOtherPlaceholder: (lang) => SubmissionFormExtension.FORM_DATA.translations[lang].placeholders.databaseName,
                            getCustomErrorMessages: (lang) => ({
                                selectAtLeastOne: SubmissionFormExtension.FORM_DATA.translations[lang].errors.databases
                            })
                        }
                    }
                ]
            },

            // Step 8: Interaction Channels
            {
                sectionId: "communication_channels", // NEW: Explicit section ID
                fields: [
                    {
                        type: 'yesno-with-options',
                        id: 'needSocialBot',
                        required: true,
                        getCustomErrorMessage: (lang) => SubmissionFormExtension.FORM_DATA.translations[lang].errors.needSocialBot,
                        yesField: {
                            type: 'multiselect',
                            id: 'socialPlatforms',
                            row: 'socialPlatforms',
                            required: true,
                            options: 'platforms.social',
                            getCustomErrorMessages: (lang) => ({
                                selectAtLeastOne: SubmissionFormExtension.FORM_DATA.translations[lang].errors.socialPlatforms
                            })
                        }
                    },
                    {
                        type: 'yesno-with-options',
                        id: 'languageType',
                        required: true,
                        getCustomErrorMessage: (lang) => SubmissionFormExtension.FORM_DATA.translations[lang].errors.languageType,
                        customOptions: [
                            {
                                value: 'multilingual',
                                label: {
                                    fr: 'Support multilingue',
                                    en: 'Multilingual Support'
                                }
                            },
                            {
                                value: 'unilingual',
                                label: {
                                    fr: 'Langue unique',
                                    en: 'Single Language'
                                }
                            }
                        ],
                        yesField: {
                            type: 'multiselect',
                            id: 'languages',
                            row: 'languages',
                            required: true,
                            options: 'languages',
                            getCustomErrorMessages: (lang) => ({
                                selectAtLeastOne: SubmissionFormExtension.FORM_DATA.translations[lang].errors.languages
                            })
                        },
                        noField: {
                            type: 'select',
                            id: 'language',
                            required: true,
                            row: 'language',
                            options: 'languages',
                            getCustomErrorMessage: (lang) => SubmissionFormExtension.FORM_DATA.translations[lang].errors.language
                        }
                    }
                ]
            },

            // Step 9: Project Summary
            {
                sectionId: "project_summary", // NEW: Explicit section ID
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
// ENHANCED CONTACT FORM EXTENSION - RESTRUCTURED ARCHITECTURE
// ============================================================================
const ContactFormExtension = {
    name: "ModernContactForm",
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
        // DRAMATICALLY SIMPLIFIED: Uses generic FormDataProcessor and BaseDataTransformer
        // Same structure as SubmissionFormExtension and other extensions
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
            ContactFormExtension.FORM_CONFIG
        );
        return await extension.render(element);
    },
    // ============================================================================
    // FORM DATA CONFIGURATION - Enhanced options and translations
    // ============================================================================
    FORM_DATA: {
        options: {
            services: [
                {
                    id: "ia_agent",
                    name: {
                        fr: "Agent IA",
                        en: "AI Agent"
                    }
                },
                {
                    id: "automation",
                    name: {
                        fr: "Automatisation",
                        en: "Automation"
                    }
                },
                {
                    id: "web_site",
                    name: {
                        fr: "Site web",
                        en: "Web Site"
                    }
                },
                {
                    id: "chatbot",
                    name: {
                        fr: "Chatbot",
                        en: "Chatbot"
                    }
                },
                {
                    id: "integration",
                    name: {
                        fr: "Intégration",
                        en: "Integration"
                    }
                },
                {
                    id: "consulting",
                    name: {
                        fr: "Conseil",
                        en: "Consulting"
                    }
                },
                {
                    id: "support",
                    name: {
                        fr: "Support technique",
                        en: "Technical Support"
                    }
                },
                {
                    id: "training",
                    name: {
                        fr: "Formation",
                        en: "Training"
                    }
                },
                {
                    id: "custom",
                    name: {
                        fr: "Projet sur mesure",
                        en: "Custom Project"
                    }
                },
                {
                    id: "other",
                    name: {
                        fr: "Autre",
                        en: "Other"
                    }
                }
                    ],
            urgencyLevels: [
                {
                    id: "low",
                    name: {
                        fr: "Non urgent",
                        en: "Not urgent"
                    }
                },
                {
                    id: "medium",
                    name: {
                        fr: "Modéré",
                        en: "Moderate"
                    }
                },
                {
                    id: "high",
                    name: {
                        fr: "Urgent",
                        en: "Urgent"
                    }
                },
                {
                    id: "critical",
                    name: {
                        fr: "Très urgent",
                        en: "Very urgent"
                    }
                }
                    ]
        },
        translations: {
            fr: {
                nav: {
                    next: "Suivant",
                    previous: "Précédent",
                    submit: "Envoyer votre demande",
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
                    otherLabel: "Autre",
                    customLabel: "Personnalisé",
                    otherService: "Autre service",
                    customUrgency: "Urgence personnalisée"
                },
                placeholders: {
                    firstName: "Entrez votre prénom",
                    lastName: "Entrez votre nom de famille",
                    email: "votre.email@example.com",
                    phone: "+33 1 23 45 67 89",
                    company: "Nom de votre société (optionnel)",
                    service: "-- Sélectionnez un service --",
                    message: "Décrivez votre projet, vos besoins et vos objectifs en détail...",
                    otherService: "Précisez le service souhaité...",
                    urgency: "-- Sélectionnez le niveau d'urgence --"
                },
                steps: [
                    {
                        title: "Informations de contact",
                        desc: "Renseignez vos coordonnées"
                    },
                    {
                        title: "Détails de votre demande",
                        desc: "Service souhaité et description du projet"
                    },
                    {
                        title: "Récapitulatif",
                        desc: "Vérifiez vos informations avant envoi"
                    }
                        ],
                fields: {
                    firstName: "Prénom",
                    lastName: "Nom de famille",
                    email: "Adresse électronique",
                    phone: "Numéro de téléphone",
                    company: "Société/Organisation (optionnel)",
                    service: "Service souhaité",
                    message: "Description détaillée de votre projet",
                    urgency: "Niveau d'urgence",
                    preferredContact: "Méthode de contact préférée"
                },
                errors: {
                    firstName: "Veuillez saisir votre prénom",
                    lastName: "Veuillez saisir votre nom de famille",
                    email: "Veuillez saisir une adresse e-mail valide",
                    emailInvalid: "Le format de l'adresse e-mail n'est pas valide",
                    phone: "Veuillez saisir un numéro de téléphone valide",
                    phoneInvalid: "Le format du numéro de téléphone n'est pas valide",
                    service: "Veuillez sélectionner un service",
                    message: "Veuillez décrire votre projet en détail",
                    urgency: "Veuillez indiquer le niveau d'urgence"
                },
                success: {
                    title: "Demande envoyée avec succès !",
                    message: "Merci pour votre demande. Notre équipe analysera votre demande et vous contactera dans les plus brefs délais."
                },
                summary: {
                    title: "Récapitulatif de votre demande",
                    description: "Vérifiez les informations saisies avant d'envoyer votre demande.",
                    editStep: "Modifier cette étape",
                    noDataProvided: "Aucune donnée fournie pour cette section"
                }
            },
            en: {
                nav: {
                    next: "Next",
                    previous: "Previous",
                    submit: "Send Your Request",
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
                    otherLabel: "Other",
                    customLabel: "Custom",
                    otherService: "Other service",
                    customUrgency: "Custom urgency"
                },
                placeholders: {
                    firstName: "Enter your first name",
                    lastName: "Enter your last name",
                    email: "your.email@example.com",
                    phone: "+1 (555) 123-4567",
                    company: "Your company name (optional)",
                    service: "-- Select a Service --",
                    message: "Describe your project, needs and objectives in detail...",
                    otherService: "Please specify the desired service...",
                    urgency: "-- Select urgency level --"
                },
                steps: [
                    {
                        title: "Contact Information",
                        desc: "Enter your contact details"
                    },
                    {
                        title: "Request Details",
                        desc: "Desired service and project description"
                    },
                    {
                        title: "Summary",
                        desc: "Review your information before sending"
                    }
                        ],
                fields: {
                    firstName: "First Name",
                    lastName: "Last Name",
                    email: "Email Address",
                    phone: "Phone Number",
                    company: "Company/Organization (optional)",
                    service: "Desired Service",
                    message: "Detailed Project Description",
                    urgency: "Urgency Level",
                    preferredContact: "Preferred Contact Method"
                },
                errors: {
                    firstName: "Please enter your first name",
                    lastName: "Please enter your last name",
                    email: "Please enter a valid email address",
                    emailInvalid: "Email format is not valid",
                    phone: "Please enter a valid phone number",
                    phoneInvalid: "Phone number format is not valid",
                    service: "Please select a service",
                    message: "Please describe your project in detail",
                    urgency: "Please indicate the urgency level"
                },
                success: {
                    title: "Request Sent Successfully!",
                    message: "Thank you for your request. Our team will analyze your request and contact you as soon as possible."
                },
                summary: {
                    title: "Request Summary",
                    description: "Please review the information provided before sending your request.",
                    editStep: "Edit this step",
                    noDataProvided: "No data provided for this section"
                }
            }
        }
    },
    // ============================================================================
    // FORM CONFIGURATION - Enhanced field definitions with modern structure
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
                        getCustomErrorMessage: (lang) => ContactFormExtension.FORM_DATA.translations[lang].errors.firstName
                            },
                    {
                        type: 'text',
                        id: 'lastName',
                        required: true,
                        row: 'name',
                        getCustomErrorMessage: (lang) => ContactFormExtension.FORM_DATA.translations[lang].errors.lastName
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
                        })
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
                        })
                            },
                    {
                        type: 'text',
                        id: 'company',
                        required: false,
                        row: 'company'
                            }
                        ]
                    },

                    // Step 2: Request Details
            {
                sectionId: "request_details", // NEW: Explicit section ID for generic processing
                fields: [
                    {
                        type: 'select-with-other',
                        id: 'service',
                        required: true,
                        options: 'services',
                        row: 'service',
                        getOtherLabel: (lang) => ContactFormExtension.FORM_DATA.translations[lang].labels.otherLabel,
                        getOtherPlaceholder: (lang) => ContactFormExtension.FORM_DATA.translations[lang].placeholders.otherService,
                        getCustomErrorMessage: (lang) => ContactFormExtension.FORM_DATA.translations[lang].errors.service
                            },
                    {
                        type: 'select',
                        id: 'urgency',
                        required: false,
                        options: 'urgencyLevels',
                        row: 'urgency'
                            },
                    {
                        type: 'textarea',
                        id: 'message',
                        row: 'message',
                        required: true,
                        maxLength: 2000,
                        rows: 8,
                        getPlaceholder: (lang) => ContactFormExtension.FORM_DATA.translations[lang].placeholders.message,
                        getCustomErrorMessage: (lang) => ContactFormExtension.FORM_DATA.translations[lang].errors.message
                            }
                        ]
                    },

                    // Step 3: Summary
            {
                sectionId: "request_summary", // NEW: Explicit section ID for generic processing
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
// ENHANCED BOOKING DIRECT EXTENSION - RESTRUCTURED ARCHITECTURE
// ============================================================================
const BookingDirectExtension = {
            name: "ModernBookingDirect",
            type: "response",
            match: ({ trace }) => trace.type === "ext_booking_direct" || trace.payload?.name === "ext_booking_direct",
            
            // ============================================================================
            // INITIALIZE REUSABLE CAL.COM UTILITY
            // ============================================================================
            initializeCalComUtility(config) {
                if (!this.calComUtility) {
                    this.calComUtility = new CalComBaseUtility({
                        apiKey: config.apiKey,
                        logPrefix: "📅 BookingDirect",
                        enableLogging: config.enableDetailedLogging !== false,
                        errorMessages: {
                            missingServiceSelection: "Service selection is required",
                            missingContactInfo: "Contact information is required",
                            bookingFailed: "Failed to create booking"
                        }
                    });
                } else {
                    if (config.apiKey) {
                        this.calComUtility.setApiKey(config.apiKey);
                    }
                }
                return this.calComUtility;
            },
            
            render: async ({ trace, element }) => {
                // ============================================================================
                // EXTRACT ALL PAYLOAD DATA INTO VARIABLES USING DESTRUCTURING
                // ============================================================================
                let { 
                    language = "fr", 
                    vf,
                    apiKey = CONFIG.DEFAULT_API_KEY,
                    timezone = "America/Toronto",
                    serviceProvider = "SkaLean",
                    voiceflowEnabled = true,
                    voiceflowDataTransformer = null,
                    enableDetailedLogging = true,
                    logPrefix = "📅 BookingDirect",
                    enableSessionTimeout = true,
                    sessionTimeout = CONFIG.SESSION_TIMEOUT,
                    sessionWarning = CONFIG.SESSION_WARNING,
                    cssUrls = CONFIG.DEFAULT_CSS,
                    formType = "booking",
                    formStructure = "multistep",
                    useStructuredData = true,
                    dataTransformer = BaseDataTransformer
                } = trace.payload || {};

                // Initialize Cal.com utility using extracted variables
                const calComUtility = BookingDirectExtension.initializeCalComUtility({
                    apiKey: apiKey,
                    enableDetailedLogging: enableDetailedLogging
                });

                // Helper function to get translated text
                const getTranslatedText = (key, lang = language) => {
                    const keys = key.split('.');
                    let value = BookingDirectExtension.FORM_DATA.translations[lang];
                    for (const k of keys) {
                        value = value?.[k];
                    }
                    return value || key;
                };

                // Update services with the provider from payload and extract correct language
                const updatedFormData = JSON.parse(JSON.stringify(BookingDirectExtension.FORM_DATA));
                updatedFormData.options.services = updatedFormData.options.services.map(service => {
                    // Extract language-specific text
                    const eventName = typeof service.eventName === 'object' ? service.eventName[language] : service.eventName;
                    const title = typeof service.title === 'object' ? service.title[language] : service.title;
                    const description = typeof service.description === 'object' ? service.description[language] : service.description;
                    const duration = typeof service.duration === 'object' ? service.duration[language] : service.duration;
                    
                    return {
                        id: service.id,
                        eventTypeId: service.eventTypeId,
                        eventTypeSlug: service.eventTypeSlug,
                        scheduleId: service.scheduleId,
                        provider: serviceProvider,
                        eventName: eventName,
                        title: title,
                        description: description,
                        duration: duration,
                        serviceName: eventName,
                        name: title, // Simple string for form field
                        displayName: title
                    };
                });

                // Clone the form config and populate variables dynamically
                const formConfig = JSON.parse(JSON.stringify(BookingDirectExtension.FORM_CONFIG));
                
                // ============================================================================
                // FIX 1: ADD PERSONALIZED ERROR MESSAGES FOR EACH FIELD
                // ============================================================================
                
                // Update firstName field with personalized error message
                const firstNameField = formConfig.steps[1].fields[0];
                firstNameField.placeholder = getTranslatedText('placeholders.firstName');
                firstNameField.customErrorMessage = getTranslatedText('errors.firstName');
                
                // Update lastName field with personalized error message  
                const lastNameField = formConfig.steps[1].fields[1];
                lastNameField.placeholder = getTranslatedText('placeholders.lastName');
                lastNameField.customErrorMessage = getTranslatedText('errors.lastName');
                
                // Update email field with personalized error messages
                const emailField = formConfig.steps[1].fields[2];
                emailField.placeholder = getTranslatedText('placeholders.email');
                emailField.customErrorMessage = getTranslatedText('errors.email');
                emailField.customErrorMessages = {
                    required: getTranslatedText('errors.email'),
                    invalid: getTranslatedText('errors.emailInvalid')
                };

                // ✅ FIX: Update service selection field with correct error message
                const serviceField = formConfig.steps[0].fields[0];
                serviceField.customErrorMessage = getTranslatedText('errors.serviceRequired');
                serviceField.customErrorMessages = {
                    serviceRequired: getTranslatedText('errors.serviceRequired'),
                    required: getTranslatedText('errors.serviceRequired')
                };
                
                // ============================================================================
                // FIX 2: CONFIGURE CALENDAR TO SHOW SELECTED SERVICE AND PROVIDER
                // ============================================================================
                
                // Populate calendar field variables dynamically
                const calendarField = formConfig.steps[2].fields[0];
                const defaultService = updatedFormData.options.services[0];
                
                // Set calendar configuration variables
                calendarField.apiKey = apiKey;
                calendarField.timezone = timezone;
                calendarField.language = language;
                calendarField.locale = language === 'fr' ? 'fr-FR' : 'en-US';

                // ✅ FIX: Use the correct property names for the new CalendarField
                calendarField.specialist = serviceProvider; // "Dr. Sophie Martin" -> this.specialist
                calendarField.selectedCategory = defaultService.eventName; // "Discovery Call" -> this.selectedCategory  
                calendarField.selectionMode = 'none'; // Direct calendar mode (no dropdowns)

                calendarField.availableServices = updatedFormData.options.services;
                calendarField.dynamicServiceUpdate = true; // Enable dynamic updates
                
                // Set default service variables
                calendarField.eventTypeId = defaultService.eventTypeId;
                calendarField.eventTypeSlug = defaultService.eventTypeSlug;
                calendarField.scheduleId = defaultService.scheduleId;
                calendarField.eventName = defaultService.eventName;
                
                // ============================================================================
                // PROVIDE ALL TRANSLATED TEXTS TO CALENDAR FIELD
                // ============================================================================
                const calendarTranslations = BookingDirectExtension.FORM_DATA.translations[language].calendar;
                calendarField.texts = {
                    selectCategory: calendarTranslations.selectService, // Maps to selectService for UI
                    selectCategoryPlaceholder: calendarTranslations.selectServicePlaceholder,
                    selectItem: calendarTranslations.selectProvider, // Maps to selectProvider for UI
                    selectItemPlaceholder: calendarTranslations.selectProviderPlaceholder,
                    selectDate: calendarTranslations.selectDate,
                    availableTimesFor: calendarTranslations.availableTimesFor,
                    noAvailableSlots: calendarTranslations.noAvailableSlots,
                    pleaseSelectDate: calendarTranslations.pleaseSelectDate,
                    pleaseSelectCategory: calendarTranslations.pleaseSelectService,
                    pleaseSelectItem: calendarTranslations.pleaseSelectProvider,
                    currentAppointment: calendarTranslations.currentAppointment,
                    newAppointment: calendarTranslations.newAppointment,
                    loadingAvailability: calendarTranslations.loadingAvailability,
                    loading: calendarTranslations.loading,
                    weekdays: calendarTranslations.weekdays
                };
                
                // Provide error texts to calendar field
                calendarField.errorTexts = {
                    categoryRequired: BookingDirectExtension.FORM_DATA.translations[language].errors.serviceSelection,
                    itemRequired: BookingDirectExtension.FORM_DATA.translations[language].errors.providerRequired || 'Please select a provider',
                    dateTimeRequired: BookingDirectExtension.FORM_DATA.translations[language].errors.dateTimeRequired
                };

                // ============================================================================
                // FIXED: Disable CreatForm's Voiceflow - CalComBaseUtility handles it
                // This prevents double-sending to Voiceflow
                // ============================================================================
                
                // Create the form with the new generic architecture using extracted variables
                const extension = new CreatForm(
                    {
                        language: language,
                        formType: formType,
                        formStructure: formStructure,
                        
                        // ============================================================================
                        // NEW: Generic approach - no specific field transformers needed!
                        // BaseDataTransformer + FormDataProcessor handle everything automatically
                        // ============================================================================
                        useStructuredData: useStructuredData,
                        dataTransformer: dataTransformer, // Generic transformer works with any form!
                        
                        // DISABLED: Webhook integration (booking goes directly to Cal.com)
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
                        
                        // Booking-specific configuration using extracted variables
                        apiKey: apiKey,
                        timezone: timezone,
                        serviceProvider: serviceProvider,
                        
                        // ============================================================================
                        // SIMPLIFIED: Just use the utility's handleBooking method!
                        // ============================================================================
                        onSubmit: async (formData) => {
                            return await calComUtility.handleBooking(formData, {
                                language: language,
                                apiKey: apiKey,
                                timezone: timezone,
                                serviceProvider: serviceProvider,
                                voiceflowEnabled: voiceflowEnabled, // ← This controls CalComBaseUtility's Voiceflow
                                formVersion: CONFIG.FORM_VERSION
                            });
                        },
                        
                        // CSS configuration using extracted variables
                        cssUrls: cssUrls
                    },
                    updatedFormData,
                    formConfig
                );

                return await extension.render(element);
            },

            // ============================================================================
            // FORM DATA CONFIGURATION - Enhanced with better error messages
            // ============================================================================
            FORM_DATA: {
                options: {
                    services: [
                        {
                            id: 1,
                            eventName: { 
                                fr: "Entretien Exploratoire",
                                en: "Discovery Call"
                            },
                            title: { 
                                fr: "Entretien exploratoire",
                                en: "Discovery Call"
                            },
                            description: { 
                                fr: "Entretien de 15 minutes visant à analyser vos besoins, définir vos objectifs et déterminer comment nos services peuvent y répondre efficacement.",
                                en: "15-minute consultation to analyze your needs, define your objectives and determine how our services can respond effectively."
                            },
                            duration: { 
                                fr: "15 minutes",
                                en: "15 minutes"
                            },
                            eventTypeId: 2355643,
                            eventTypeSlug: "discovery-call-15-minutes",
                            scheduleId: 628047,
                            provider: "SkaLean"
                        },
                        {
                            id: 2,
                            eventName: { 
                                fr: "Démonstration de l'Agent IA",
                                en: "AI Agent Demonstration"
                            },
                            title: { 
                                fr: "Démonstration de l'Agent IA",
                                en: "AI Agent Demonstration"
                            },
                            description: { 
                                fr: "Démonstration détaillée illustrant les capacités et les applications pratiques de notre technologie d'Agent IA en 15 minutes.",
                                en: "Detailed demonstration showcasing the capabilities and practical applications of our AI Agent technology in 15 minutes."
                            },
                            duration: { 
                                fr: "15 minutes",
                                en: "15 minutes"
                            },
                            eventTypeId: 2355602,
                            eventTypeSlug: "demonstration-chatbot-15min",
                            scheduleId: 628047,
                            provider: "SkaLean"
                        },
                        {
                            id: 3,
                            eventName: { 
                                fr: "Présentation Détaillée",
                                en: "Detailed Presentation"
                            },
                            title: { 
                                fr: "Présentation",
                                en: "Presentation"
                            },
                            description: { 
                                fr: "Session de 45 minutes réservée aux clients ayant déjà effectué un entretien exploratoire ou rencontré notre équipe en personne, destinée à présenter des solutions personnalisées et des recommandations stratégiques.",
                                en: "45-minute session reserved for clients who have already completed a discovery call or met our team in person, designed to present personalized solutions and strategic recommendations."
                            },
                            duration: { 
                                fr: "45 minutes",
                                en: "45 minutes"
                            },
                            eventTypeId: 2355601,
                            eventTypeSlug: "reunion-45min",
                            scheduleId: 631172,
                            provider: "SkaLean"
                        },
                        {
                            id: 4,
                            eventName: { 
                                fr: "Session de Travail",
                                en: "Working Session"
                            },
                            title: { 
                                fr: "Session de travail",
                                en: "Working Session"
                            },
                            description: { 
                                fr: "Session collaborative de 60 minutes dédiée aux projets en cours, aux suivis approfondis et aux séances de réflexion stratégique.",
                                en: "60-minute collaborative session dedicated to ongoing projects, in-depth follow-ups and strategic brainstorming sessions."
                            },
                            duration: { 
                                fr: "60 minutes",
                                en: "60 minutes"
                            },
                            eventTypeId: 2355663,
                            eventTypeSlug: "reunion-projet",
                            scheduleId: 628644,
                            provider: "SkaLean"
                        }
                    ]
                },
                
                translations: {
                    fr: {
                        nav: { 
                            next: "Suivant", 
                            previous: "Précédent", 
                            submit: "Confirmer la réservation", 
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
                            selectedService: "Service sélectionné",
                            appointmentDetails: "Détails du rendez-vous"
                        },
                        placeholders: {
                            firstName: "Entrez votre prénom",
                            lastName: "Entrez votre nom de famille",
                            email: "votre.email@example.com"
                        },
                        steps: [
                            { title: "Sélection du Service", desc: "Choisissez le service qui vous intéresse le plus" },
                            { title: "Informations de Contact", desc: "Renseignez vos informations de contact" },
                            { title: "Date et Heure", desc: "Choisissez votre créneau préféré" }
                        ],
                        fields: {
                            serviceSelection: "Sélectionnez un service",
                            firstName: "Prénom",
                            lastName: "Nom de famille",
                            email: "Adresse électronique",
                            appointment: "Sélectionnez date et heure",
                            scheduledWith: "Programmé avec",
                            serviceName: "Service"
                        },
                        errors: {
                            serviceSelection: "Veuillez sélectionner un service",
                            serviceRequired: "Veuillez sélectionner un service", // ✅ FIX: Add the key that ServiceCardField expects
                            // FIX 1: More personalized error messages
                            firstName: "Le prénom est requis",
                            lastName: "Le nom de famille est requis", 
                            email: "Une adresse email valide est requise",
                            emailInvalid: "Le format de l'adresse email n'est pas valide",
                            appointment: "Veuillez sélectionner une date et une heure",
                            dateTimeRequired: "Veuillez sélectionner une date et une heure",
                            bookingError: "Erreur lors de la réservation. Veuillez réessayer.",
                            providerRequired: "Veuillez sélectionner un fournisseur de services"
                        },
                        success: { 
                            title: "Rendez-vous confirmé !", 
                            message: "Votre rendez-vous a été programmé avec succès. Vous recevrez sous peu un email de confirmation." 
                        },
                        calendar: {
                            selectService: "Sélectionner un service",
                            selectServicePlaceholder: "-- Sélectionner un service --",
                            selectProvider: "Sélectionner un fournisseur de services",
                            selectProviderPlaceholder: "-- Sélectionner un fournisseur --",
                            selectDate: "Sélectionnez une date pour voir les horaires disponibles",
                            availableTimesFor: "Disponibilités pour",
                            noAvailableSlots: "Aucun horaire disponible pour cette date",
                            pleaseSelectDate: "Veuillez d'abord sélectionner une date",
                            pleaseSelectService: "Veuillez d'abord sélectionner un service",
                            pleaseSelectProvider: "Veuillez d'abord sélectionner un fournisseur de services",
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
                            submit: "Confirm Booking", 
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
                            selectedService: "Selected Service",
                            appointmentDetails: "Appointment Details"
                        },
                        placeholders: {
                            firstName: "Enter your first name",
                            lastName: "Enter your last name",
                            email: "your.email@example.com"
                        },
                        steps: [
                            { title: "Service Selection", desc: "Choose the service that interests you most" },
                            { title: "Contact Information", desc: "Enter your contact information" },
                            { title: "Date & Time", desc: "Choose your preferred time slot" }
                        ],
                        fields: {
                            serviceSelection: "Select a Service",
                            firstName: "First Name",
                            lastName: "Last Name",
                            email: "Email Address",
                            appointment: "Select date and time",
                            scheduledWith: "Scheduled with",
                            serviceName: "Service"
                        },
                        errors: {
                            serviceSelection: "Please select a service",
                            serviceRequired: "Please select a service", // ✅ FIX: Add the key that ServiceCardField expects
                            // FIX 1: More personalized error messages
                            firstName: "First name is required",
                            lastName: "Last name is required",
                            email: "A valid email address is required",
                            emailInvalid: "Email format is not valid",
                            appointment: "Please select a date and time",
                            dateTimeRequired: "Please select a date and time",
                            bookingError: "Booking error. Please try again.",
                            providerRequired: "Please select a service provider"
                        },
                        success: { 
                            title: "Appointment Confirmed!", 
                            message: "Your appointment has been successfully scheduled. You will receive a confirmation email shortly." 
                        },
                        calendar: {
                            selectService: "Select a service",
                            selectServicePlaceholder: "-- Select a service --",
                            selectProvider: "Select a service provider",
                            selectProviderPlaceholder: "-- Select a provider --",
                            selectDate: "Select a date to view available times",
                            availableTimesFor: "Available times for",
                            noAvailableSlots: "No available time slots for this date",
                            pleaseSelectDate: "Please select a date first",
                            pleaseSelectService: "Please select a service first",
                            pleaseSelectProvider: "Please select a service provider first",
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
            // FORM CONFIGURATION - Enhanced with better field configuration
            // ============================================================================
            FORM_CONFIG: {
                steps: [
                    // Step 1: Service Selection
                    {
                        sectionId: "service_selection", // NEW: Explicit section ID for generic processing
                        fields: [
                            {
                                type: 'serviceCard',
                                id: 'serviceSelection',
                                required: true,
                                options: 'services',
                                layout: 'grid',
                                columns: 'auto',
                                showDuration: true,
                                showDescription: true,
                                selectionMode: 'single',
                                allowDeselect: false,
                                // ✅ FIX: Error messages will be set dynamically in render()
                                
                                // Add callback to update calendar when service is selected
                                onChange: function(selectedService) {
                                    if (selectedService && this.factory) {
                                        // Find calendar field in the form and update it
                                        const calendarField = this.factory.findCalendarField();
                                        if (calendarField) {
                                            calendarField.updateServiceConfiguration(selectedService);
                                        }
                                    }
                                }
                            }
                        ]
                    },
                    
                    // Step 2: Contact Information
                    {
                        sectionId: "contact_information", // NEW: Explicit section ID for generic processing
                        fields: [
                            {
                                type: 'text',
                                id: 'firstName',
                                required: true,
                                row: 'name',
                                placeholder: '{{placeholder}}', // Will be populated dynamically
                                customErrorMessage: '{{customErrorMessage}}' // Will be populated dynamically
                            },
                            {
                                type: 'text',
                                id: 'lastName',
                                required: true,
                                row: 'name',
                                placeholder: '{{placeholder}}', // Will be populated dynamically
                                customErrorMessage: '{{customErrorMessage}}' // Will be populated dynamically
                            },
                            {
                                type: 'email',
                                id: 'email',
                                required: true,
                                row: 'email',
                                placeholder: '{{placeholder}}', // Will be populated dynamically
                                customErrorMessage: '{{customErrorMessage}}', // Will be populated dynamically
                                customErrorMessages: '{{customErrorMessages}}' // Will be populated dynamically
                            }
                        ]
                    },
                    
                    // Step 3: Calendar - Variables will be populated dynamically during render()
                    {
                        sectionId: "appointment_scheduling", // NEW: Explicit section ID for generic processing
                        fields: [
                            {
                                type: 'calendar',
                                id: 'appointment',
                                row: 'appointment',
                                required: true,
                                mode: 'booking',
                                headerIcon: 'CALENDAR',
                                
                                // These parameters will be dynamically populated during render()
                                apiKey: '{{apiKey}}',
                                timezone: '{{timezone}}',
                                language: '{{language}}',
                                eventTypeId: '{{eventTypeId}}',
                                eventTypeSlug: '{{eventTypeSlug}}',
                                scheduleId: '{{scheduleId}}',
                                specialist: '{{specialist}}',
                                selectedCategory: '{{selectedCategory}}',
                                eventName: '{{eventName}}',
                                availableServices: '{{availableServices}}',
                                dynamicServiceUpdate: true,
                                
                                getCustomErrorMessage: (lang) => BookingDirectExtension.FORM_DATA.translations[lang].errors.appointment,
                                getCustomErrorMessages: (lang) => ({
                                    required: BookingDirectExtension.FORM_DATA.translations[lang].errors.dateTimeRequired,
                                    bookingError: BookingDirectExtension.FORM_DATA.translations[lang].errors.bookingError
                                })
                            }
                        ]
                    }
                ]
            },

            // ============================================================================
            // HELPER METHODS - Same as before, no changes needed
            // ============================================================================
            
            getServiceName: (eventTypeSlug, language = 'fr') => {
                // Find service by eventTypeSlug in the services array
                const service = BookingDirectExtension.FORM_DATA.options.services.find(
                    s => s.eventTypeSlug === eventTypeSlug
                );
                
                if (service && service.eventName) {
                    // Return the correct language version
                    if (typeof service.eventName === 'object') {
                        return service.eventName[language] || service.eventName.fr || service.eventName.en;
                    }
                    return service.eventName;
                }
                
                // Fallback: format the slug nicely
                if (eventTypeSlug) {
                    return eventTypeSlug
                        .replace(/-/g, ' ')
                        .replace(/\b\w/g, l => l.toUpperCase());
                }
                
                return 'Service';
            }
        };



// ============================================================================
// ENHANCED RESCHEDULE CALENDAR EXTENSION - RESTRUCTURED ARCHITECTURE
// ============================================================================
const RescheduleCalendarExtension = {
            name: "ModernRescheduleCalendar",
            type: "response",
            match: ({ trace }) => trace.type === "ext_reschedule_calendar" || trace.payload?.name === "ext_reschedule_calendar",
            
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
            
            render: async ({ trace, element }) => {
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
                const extension = new CreatForm(
                    {
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
                            { title: "Informations Actuelles", desc: "Consultez les informations actuelles et indiquez la raison de la replanification" },
                            { title: "Nouvelle Date et Heure", desc: "Choisissez votre nouveau créneau préféré" }
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
                            { title: "Current Information", desc: "Review current information and provide reason for rescheduling" },
                            { title: "New Date & Time", desc: "Choose your new preferred time slot" }
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
            match: ({ trace }) => trace.type === "ext_cancellation_direct" || trace.payload?.name === "ext_cancellation_direct",
            
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
            
            render: async ({ trace, element }) => {
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
                // FIXED: Disable CreatForm's Voiceflow - CalComBaseUtility handles it
                // This prevents double-sending to Voiceflow
                // ============================================================================
                
                // Create the form with the new generic architecture using extracted variables
                const extension = new CreatForm(
                    {
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
                                voiceflowEnabled: voiceflowEnabled, // ← This controls CalComBaseUtility's Voiceflow
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
                            { title: "Annuler Votre Rendez-vous", desc: "Consultez les informations de votre rendez-vous et indiquez la raison de l'annulation" }
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
                            { title: "Cancel Your Appointment", desc: "Review your appointment information and provide a reason for cancellation" }
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
// SETUP AND INITIALIZATION
// ============================================================================
// Set up extension for global access
window.SubmissionFormExtension = SubmissionFormExtension;
window.ContactFormExtension = ContactFormExtension;
window.BookingDirectExtension = BookingDirectExtension;
window.RescheduleCalendarExtension = RescheduleCalendarExtension;
window.CancellationDirectExtension = CancellationDirectExtension;
