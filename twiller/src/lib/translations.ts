// Complete translation dictionaries for all 6 supported languages
// Keys are organized by component/feature area

export type LanguageCode = "en" | "es" | "hi" | "pt" | "zh" | "fr";

export interface LanguageInfo {
  code: LanguageCode;
  name: string;
  nativeName: string;
  flag: string;
}

export const LANGUAGES: LanguageInfo[] = [
  { code: "en", name: "English", nativeName: "English", flag: "🇺🇸" },
  { code: "es", name: "Spanish", nativeName: "Español", flag: "🇪🇸" },
  { code: "hi", name: "Hindi", nativeName: "हिन्दी", flag: "🇮🇳" },
  { code: "pt", name: "Portuguese", nativeName: "Português", flag: "🇧🇷" },
  { code: "zh", name: "Chinese", nativeName: "中文", flag: "🇨🇳" },
  { code: "fr", name: "French", nativeName: "Français", flag: "🇫🇷" },
];

type TranslationKeys = {
  [key: string]: string;
};

type Translations = {
  [lang in LanguageCode]: TranslationKeys;
};

const translations: Translations = {
  en: {
    // ── Sidebar
    "sidebar.home": "Home",
    "sidebar.explore": "Explore",
    "sidebar.notifications": "Notifications",
    "sidebar.messages": "Messages",
    "sidebar.bookmarks": "Bookmarks",
    "sidebar.premium": "Premium",
    "sidebar.communities": "Communities",
    "sidebar.profile": "Profile",
    "sidebar.more": "More",
    "sidebar.post": "Post",
    "sidebar.settings": "Settings and privacy",
    "sidebar.helpCenter": "Help Center",
    "sidebar.logout": "Log out",

    // ── Feed
    "feed.home": "Home",
    "feed.forYou": "For you",
    "feed.following": "Following",
    "feed.loading": "Loading tweets...",
    "feed.welcomeFollowing": "Welcome to your Following feed",
    "feed.followPeople": "Follow people to start seeing their posts here. Find people to follow in Explore or from the suggestions on the right.",
    "feed.noPosts": "No posts yet",
    "feed.noFollowingPosts": "None of the people you follow have posted yet.",
    "feed.beFirst": "Be the first to post something!",

    // ── TweetComposer
    "composer.placeholder": "What is happening?!",
    "composer.post": "Post",
    "composer.posting": "Posting...",

    // ── TweetCard
    "tweet.reply": "Reply",
    "tweet.repost": "Repost",
    "tweet.like": "Like",
    "tweet.bookmark": "Bookmark",
    "tweet.share": "Share",
    "tweet.replies": "replies",
    "tweet.viewReplies": "View replies",
    "tweet.hideReplies": "Hide replies",
    "tweet.replyPlaceholder": "Post your reply",

    // ── Settings
    "settings.title": "Settings",
    "settings.subtitle": "Manage your account preferences",
    "settings.yourAccount": "Your Account",
    "settings.editProfile": "Edit Profile Information",
    "settings.editProfileDesc": "Bio, location, website, avatar",
    "settings.privacyPrefs": "Privacy & Preferences",
    "settings.privateAccount": "Private Account",
    "settings.privateAccountDesc": "Only approved followers can see posts",
    "settings.pushNotifications": "Push Notifications",
    "settings.pushNotificationsDesc": "Receive alerts for likes & replies",
    "settings.logOut": "Log Out",
    "settings.privacyUpdated": "Privacy setting updated",
    "settings.notificationUpdated": "Notification setting updated",
    "settings.language": "Language",
    "settings.languageDesc": "Change display language",
    "settings.currentLanguage": "Current",

    // ── Language Switcher
    "lang.title": "Display Language",
    "lang.subtitle": "Select your preferred language. Verification required.",
    "lang.current": "Current",
    "lang.switchTo": "Switch to",
    "lang.verifyEmail": "OTP sent to your registered email",
    "lang.verifyMobile": "OTP sent to your registered mobile",
    "lang.enterOtp": "Enter verification code",
    "lang.verify": "Verify & Apply",
    "lang.verifying": "Verifying...",
    "lang.sending": "Sending OTP...",
    "lang.resend": "Resend OTP",
    "lang.success": "Language changed successfully!",
    "lang.phoneRequired": "Phone number required",
    "lang.phoneRequiredDesc": "A phone number is required for language verification. Please enter your mobile number.",
    "lang.phonePlaceholder": "Enter phone number (e.g., +91...)",
    "lang.phoneSave": "Save & Continue",
    "lang.phoneSaving": "Saving...",
    "lang.cancel": "Cancel",
    "lang.back": "Back",

    // ── Notifications
    "notifications.title": "Notifications",
    "notifications.all": "All",
    "notifications.social": "Social",
    "notifications.keyword": "Keyword Alerts",
    "notifications.noNotifications": "Nothing to see here — yet",
    "notifications.noNotificationsDesc": "When someone interacts with your posts, it'll show up here.",
    "notifications.noKeyword": "No keyword alerts yet",
    "notifications.noKeywordDesc": "When tweets match your notification keywords, they'll appear here.",
    "notifications.clearAll": "Clear all",
    "notifications.likedPost": "liked your post",
    "notifications.followedYou": "followed you",
    "notifications.reposted": "reposted your post",
    "notifications.replied": "replied to your post",
    "notifications.mentioned": "mentioned you",

    // ── Messages
    "messages.title": "Messages",
    "messages.search": "Search Direct Messages",
    "messages.selectConvo": "Select a conversation",
    "messages.selectConvoDesc": "Choose from your existing conversations or start a new one.",
    "messages.newMessage": "New message",
    "messages.typeMessage": "Start a new message",
    "messages.send": "Send",

    // ── Bookmarks
    "bookmarks.title": "Bookmarks",
    "bookmarks.loading": "Loading bookmarks...",
    "bookmarks.empty": "Save posts for later",
    "bookmarks.emptyDesc": "Don't let the good ones fly away! Bookmark posts to easily find them again in the future.",

    // ── Profile
    "profile.posts": "Posts",
    "profile.replies": "Replies",
    "profile.likes": "Likes",
    "profile.followers": "Followers",
    "profile.following": "Following",
    "profile.follow": "Follow",
    "profile.unfollow": "Unfollow",
    "profile.editProfile": "Edit profile",
    "profile.loginHistory": "Login History",
    "profile.joined": "Joined",
    "profile.noPosts": "No posts yet",
    "profile.noPostsDesc": "When you post something, it will show up here.",

    // ── Explore
    "explore.title": "Explore",
    "explore.searchPlaceholder": "Search posts, people...",
    "explore.trending": "Trending",
    "explore.people": "People",
    "explore.noResults": "No results found",
    "explore.noResultsDesc": "Try searching for something else.",

    // ── Edit Profile
    "editProfile.title": "Edit profile",
    "editProfile.name": "Name",
    "editProfile.bio": "Bio",
    "editProfile.location": "Location",
    "editProfile.website": "Website",
    "editProfile.save": "Save",
    "editProfile.saving": "Saving...",

    // ── Subscription
    "subscription.title": "Premium",
    "subscription.subtitle": "Choose the plan that works for you",
    "subscription.currentPlan": "Current Plan",
    "subscription.upgrade": "Upgrade",
    "subscription.subscribe": "Subscribe",
    "subscription.managePlan": "Manage Plan",
    "subscription.tweetsUsed": "tweets used",
    "subscription.tweetsRemaining": "tweets remaining",
    "subscription.unlimited": "Unlimited",
    "subscription.perMonth": "/month",
    "subscription.free": "Free",

    // ── Landing
    "landing.happening": "Happening now",
    "landing.joinToday": "Join today.",
    "landing.signUpGoogle": "Sign up with Google",
    "landing.or": "or",
    "landing.createAccount": "Create account",
    "landing.terms": "Terms of Service",
    "landing.privacy": "Privacy Policy",
    "landing.cookies": "Cookie Use",
    "landing.termsText": "By signing up, you agree to the",
    "landing.and": "and",
    "landing.including": "including",
    "landing.alreadyAccount": "Already have an account?",
    "landing.signIn": "Sign in",

    // ── Right Sidebar
    "rightSidebar.search": "Search",
    "rightSidebar.subscribePremium": "Subscribe to Premium",
    "rightSidebar.subscribePremiumDesc": "Subscribe to unlock new features and post more tweets.",
    "rightSidebar.planActive": "Plan Active",
    "rightSidebar.managePlanDesc": "Manage your subscription, view usage, or upgrade your plan.",
    "rightSidebar.managePlan": "Manage Plan",
    "rightSidebar.subscribe": "Subscribe",
    "rightSidebar.trendsForYou": "Trends for you",
    "rightSidebar.showMore": "Show more",
    "rightSidebar.youMightLike": "You might like",
    "rightSidebar.follow": "Follow",
    "rightSidebar.following": "Following",

    // ── Common
    "common.loading": "Loading...",
    "common.error": "Something went wrong",
    "common.retry": "Retry",
    "common.close": "Close",
    "common.save": "Save",
    "common.cancel": "Cancel",
    "common.delete": "Delete",
    "common.edit": "Edit",
    "common.posts": "posts",
  },

  es: {
    "sidebar.home": "Inicio", "sidebar.explore": "Explorar", "sidebar.notifications": "Notificaciones", "sidebar.messages": "Mensajes", "sidebar.bookmarks": "Guardados", "sidebar.premium": "Premium", "sidebar.communities": "Comunidades", "sidebar.profile": "Perfil", "sidebar.more": "Más", "sidebar.post": "Publicar", "sidebar.settings": "Configuración y privacidad", "sidebar.helpCenter": "Centro de ayuda", "sidebar.logout": "Cerrar sesión",
    "feed.home": "Inicio", "feed.forYou": "Para ti", "feed.following": "Siguiendo", "feed.loading": "Cargando publicaciones...", "feed.welcomeFollowing": "Bienvenido a tu feed de Siguiendo", "feed.followPeople": "Sigue a personas para empezar a ver sus publicaciones aquí.", "feed.noPosts": "No hay publicaciones aún", "feed.noFollowingPosts": "Ninguna de las personas que sigues ha publicado aún.", "feed.beFirst": "¡Sé el primero en publicar algo!",
    "composer.placeholder": "¡¿Qué está pasando?!", "composer.post": "Publicar", "composer.posting": "Publicando...",
    "tweet.reply": "Responder", "tweet.repost": "Republicar", "tweet.like": "Me gusta", "tweet.bookmark": "Guardar", "tweet.share": "Compartir", "tweet.replies": "respuestas", "tweet.viewReplies": "Ver respuestas", "tweet.hideReplies": "Ocultar respuestas", "tweet.replyPlaceholder": "Publica tu respuesta",
    "settings.title": "Configuración", "settings.subtitle": "Administra las preferencias de tu cuenta", "settings.yourAccount": "Tu Cuenta", "settings.editProfile": "Editar información del perfil", "settings.editProfileDesc": "Bio, ubicación, sitio web, avatar", "settings.privacyPrefs": "Privacidad y Preferencias", "settings.privateAccount": "Cuenta Privada", "settings.privateAccountDesc": "Solo seguidores aprobados pueden ver publicaciones", "settings.pushNotifications": "Notificaciones Push", "settings.pushNotificationsDesc": "Recibir alertas de me gusta y respuestas", "settings.logOut": "Cerrar Sesión", "settings.privacyUpdated": "Configuración de privacidad actualizada", "settings.notificationUpdated": "Configuración de notificaciones actualizada", "settings.language": "Idioma", "settings.languageDesc": "Cambiar idioma de visualización", "settings.currentLanguage": "Actual",
    "lang.title": "Idioma de Visualización", "lang.subtitle": "Selecciona tu idioma preferido. Se requiere verificación.", "lang.current": "Actual", "lang.switchTo": "Cambiar a", "lang.verifyEmail": "OTP enviado a tu correo electrónico registrado", "lang.verifyMobile": "OTP enviado a tu móvil registrado", "lang.enterOtp": "Ingresa el código de verificación", "lang.verify": "Verificar y Aplicar", "lang.verifying": "Verificando...", "lang.sending": "Enviando OTP...", "lang.resend": "Reenviar OTP", "lang.success": "¡Idioma cambiado exitosamente!", "lang.phoneRequired": "Número de teléfono requerido", "lang.phoneRequiredDesc": "Se requiere un número de teléfono para la verificación de idioma.", "lang.phonePlaceholder": "Ingresa tu número de teléfono", "lang.phoneSave": "Guardar y Continuar", "lang.phoneSaving": "Guardando...", "lang.cancel": "Cancelar", "lang.back": "Atrás",
    "notifications.title": "Notificaciones", "notifications.all": "Todas", "notifications.social": "Social", "notifications.keyword": "Alertas de Palabras", "notifications.noNotifications": "Nada que ver aquí — aún", "notifications.noNotificationsDesc": "Cuando alguien interactúe con tus publicaciones, aparecerá aquí.", "notifications.noKeyword": "Sin alertas de palabras clave aún", "notifications.noKeywordDesc": "Cuando los tweets coincidan con tus palabras clave, aparecerán aquí.", "notifications.clearAll": "Borrar todo", "notifications.likedPost": "le gustó tu publicación", "notifications.followedYou": "te siguió", "notifications.reposted": "republicó tu publicación", "notifications.replied": "respondió a tu publicación", "notifications.mentioned": "te mencionó",
    "messages.title": "Mensajes", "messages.search": "Buscar Mensajes Directos", "messages.selectConvo": "Selecciona una conversación", "messages.selectConvoDesc": "Elige entre tus conversaciones existentes o inicia una nueva.", "messages.newMessage": "Nuevo mensaje", "messages.typeMessage": "Iniciar un nuevo mensaje", "messages.send": "Enviar",
    "bookmarks.title": "Guardados", "bookmarks.loading": "Cargando guardados...", "bookmarks.empty": "Guarda publicaciones para después", "bookmarks.emptyDesc": "¡No dejes que las buenas se escapen! Guarda publicaciones para encontrarlas fácilmente en el futuro.",
    "profile.posts": "Publicaciones", "profile.replies": "Respuestas", "profile.likes": "Me gusta", "profile.followers": "Seguidores", "profile.following": "Siguiendo", "profile.follow": "Seguir", "profile.unfollow": "Dejar de seguir", "profile.editProfile": "Editar perfil", "profile.loginHistory": "Historial de inicio de sesión", "profile.joined": "Se unió", "profile.noPosts": "Sin publicaciones aún", "profile.noPostsDesc": "Cuando publiques algo, aparecerá aquí.",
    "explore.title": "Explorar", "explore.searchPlaceholder": "Buscar publicaciones, personas...", "explore.trending": "Tendencias", "explore.people": "Personas", "explore.noResults": "No se encontraron resultados", "explore.noResultsDesc": "Intenta buscar algo diferente.",
    "editProfile.title": "Editar perfil", "editProfile.name": "Nombre", "editProfile.bio": "Bio", "editProfile.location": "Ubicación", "editProfile.website": "Sitio web", "editProfile.save": "Guardar", "editProfile.saving": "Guardando...",
    "subscription.title": "Premium", "subscription.subtitle": "Elige el plan que funcione para ti", "subscription.currentPlan": "Plan Actual", "subscription.upgrade": "Mejorar", "subscription.subscribe": "Suscribirse", "subscription.managePlan": "Administrar Plan", "subscription.tweetsUsed": "tweets usados", "subscription.tweetsRemaining": "tweets restantes", "subscription.unlimited": "Ilimitado", "subscription.perMonth": "/mes", "subscription.free": "Gratis",
    "landing.happening": "Lo que está pasando", "landing.joinToday": "Únete hoy.", "landing.signUpGoogle": "Registrarse con Google", "landing.or": "o", "landing.createAccount": "Crear cuenta", "landing.terms": "Términos de Servicio", "landing.privacy": "Política de Privacidad", "landing.cookies": "Uso de Cookies", "landing.termsText": "Al registrarte, aceptas los", "landing.and": "y", "landing.including": "incluyendo", "landing.alreadyAccount": "¿Ya tienes una cuenta?", "landing.signIn": "Iniciar sesión",
    "rightSidebar.search": "Buscar", "rightSidebar.subscribePremium": "Suscríbete a Premium", "rightSidebar.subscribePremiumDesc": "Suscríbete para desbloquear nuevas funciones y publicar más tweets.", "rightSidebar.planActive": "Plan Activo", "rightSidebar.managePlanDesc": "Administra tu suscripción, ve el uso o mejora tu plan.", "rightSidebar.managePlan": "Administrar Plan", "rightSidebar.subscribe": "Suscribirse", "rightSidebar.trendsForYou": "Tendencias para ti", "rightSidebar.showMore": "Mostrar más", "rightSidebar.youMightLike": "Te puede gustar", "rightSidebar.follow": "Seguir", "rightSidebar.following": "Siguiendo",
    "common.loading": "Cargando...", "common.error": "Algo salió mal", "common.retry": "Reintentar", "common.close": "Cerrar", "common.save": "Guardar", "common.cancel": "Cancelar", "common.delete": "Eliminar", "common.edit": "Editar", "common.posts": "publicaciones",
  },

  hi: {
    "sidebar.home": "होम", "sidebar.explore": "एक्सप्लोर", "sidebar.notifications": "सूचनाएं", "sidebar.messages": "संदेश", "sidebar.bookmarks": "बुकमार्क", "sidebar.premium": "प्रीमियम", "sidebar.communities": "समुदाय", "sidebar.profile": "प्रोफ़ाइल", "sidebar.more": "और", "sidebar.post": "पोस्ट", "sidebar.settings": "सेटिंग्स और गोपनीयता", "sidebar.helpCenter": "सहायता केंद्र", "sidebar.logout": "लॉग आउट",
    "feed.home": "होम", "feed.forYou": "आपके लिए", "feed.following": "फ़ॉलो किए हुए", "feed.loading": "ट्वीट लोड हो रहे हैं...", "feed.welcomeFollowing": "अपने फ़ॉलोइंग फ़ीड में आपका स्वागत है", "feed.followPeople": "यहां पोस्ट देखने के लिए लोगों को फ़ॉलो करें।", "feed.noPosts": "अभी कोई पोस्ट नहीं", "feed.noFollowingPosts": "आपके द्वारा फ़ॉलो किए गए लोगों ने अभी तक पोस्ट नहीं किया है।", "feed.beFirst": "कुछ पोस्ट करने वाले पहले व्यक्ति बनें!",
    "composer.placeholder": "क्या हो रहा है?!", "composer.post": "पोस्ट", "composer.posting": "पोस्ट हो रहा है...",
    "tweet.reply": "जवाब दें", "tweet.repost": "रीपोस्ट", "tweet.like": "पसंद", "tweet.bookmark": "बुकमार्क", "tweet.share": "शेयर", "tweet.replies": "जवाब", "tweet.viewReplies": "जवाब देखें", "tweet.hideReplies": "जवाब छिपाएं", "tweet.replyPlaceholder": "अपना जवाब पोस्ट करें",
    "settings.title": "सेटिंग्स", "settings.subtitle": "अपने खाते की प्राथमिकताएं प्रबंधित करें", "settings.yourAccount": "आपका खाता", "settings.editProfile": "प्रोफ़ाइल जानकारी संपादित करें", "settings.editProfileDesc": "बायो, स्थान, वेबसाइट, अवतार", "settings.privacyPrefs": "गोपनीयता और प्राथमिकताएं", "settings.privateAccount": "प्राइवेट अकाउंट", "settings.privateAccountDesc": "केवल स्वीकृत फ़ॉलोवर ही पोस्ट देख सकते हैं", "settings.pushNotifications": "पुश नोटिफिकेशन", "settings.pushNotificationsDesc": "लाइक और जवाब के लिए अलर्ट प्राप्त करें", "settings.logOut": "लॉग आउट", "settings.privacyUpdated": "गोपनीयता सेटिंग अपडेट हुई", "settings.notificationUpdated": "अधिसूचना सेटिंग अपडेट हुई", "settings.language": "भाषा", "settings.languageDesc": "प्रदर्शन भाषा बदलें", "settings.currentLanguage": "वर्तमान",
    "lang.title": "प्रदर्शन भाषा", "lang.subtitle": "अपनी पसंदीदा भाषा चुनें। सत्यापन आवश्यक है।", "lang.current": "वर्तमान", "lang.switchTo": "बदलें", "lang.verifyEmail": "OTP आपके पंजीकृत ईमेल पर भेजा गया", "lang.verifyMobile": "OTP आपके पंजीकृत मोबाइल पर भेजा गया", "lang.enterOtp": "सत्यापन कोड दर्ज करें", "lang.verify": "सत्यापित करें और लागू करें", "lang.verifying": "सत्यापित हो रहा है...", "lang.sending": "OTP भेजा जा रहा है...", "lang.resend": "OTP पुनः भेजें", "lang.success": "भाषा सफलतापूर्वक बदली गई!", "lang.phoneRequired": "फ़ोन नंबर आवश्यक", "lang.phoneRequiredDesc": "भाषा सत्यापन के लिए फ़ोन नंबर आवश्यक है।", "lang.phonePlaceholder": "फ़ोन नंबर दर्ज करें (जैसे, +91...)", "lang.phoneSave": "सहेजें और जारी रखें", "lang.phoneSaving": "सहेजा जा रहा है...", "lang.cancel": "रद्द करें", "lang.back": "वापस",
    "notifications.title": "सूचनाएं", "notifications.all": "सभी", "notifications.social": "सामाजिक", "notifications.keyword": "कीवर्ड अलर्ट", "notifications.noNotifications": "अभी यहां कुछ नहीं है", "notifications.noNotificationsDesc": "जब कोई आपकी पोस्ट के साथ इंटरैक्ट करेगा, तो यह यहां दिखाई देगा।", "notifications.noKeyword": "अभी कोई कीवर्ड अलर्ट नहीं", "notifications.noKeywordDesc": "जब ट्वीट आपके कीवर्ड से मेल खाएंगे, तो वे यहां दिखाई देंगे।", "notifications.clearAll": "सभी साफ करें", "notifications.likedPost": "ने आपकी पोस्ट पसंद की", "notifications.followedYou": "ने आपको फ़ॉलो किया", "notifications.reposted": "ने आपकी पोस्ट रीपोस्ट की", "notifications.replied": "ने आपकी पोस्ट का जवाब दिया", "notifications.mentioned": "ने आपका उल्लेख किया",
    "messages.title": "संदेश", "messages.search": "डायरेक्ट मैसेज खोजें", "messages.selectConvo": "एक बातचीत चुनें", "messages.selectConvoDesc": "अपनी मौजूदा बातचीत में से चुनें या एक नई शुरू करें।", "messages.newMessage": "नया संदेश", "messages.typeMessage": "एक नया संदेश शुरू करें", "messages.send": "भेजें",
    "bookmarks.title": "बुकमार्क", "bookmarks.loading": "बुकमार्क लोड हो रहे हैं...", "bookmarks.empty": "बाद के लिए पोस्ट सहेजें", "bookmarks.emptyDesc": "अच्छी पोस्ट को जाने न दें! भविष्य में आसानी से खोजने के लिए पोस्ट को बुकमार्क करें।",
    "profile.posts": "पोस्ट", "profile.replies": "जवाब", "profile.likes": "पसंद", "profile.followers": "फ़ॉलोवर", "profile.following": "फ़ॉलोइंग", "profile.follow": "फ़ॉलो करें", "profile.unfollow": "अनफ़ॉलो", "profile.editProfile": "प्रोफ़ाइल संपादित करें", "profile.loginHistory": "लॉगिन इतिहास", "profile.joined": "शामिल हुए", "profile.noPosts": "अभी कोई पोस्ट नहीं", "profile.noPostsDesc": "जब आप कुछ पोस्ट करेंगे, तो यह यहां दिखाई देगा।",
    "explore.title": "एक्सप्लोर", "explore.searchPlaceholder": "पोस्ट, लोग खोजें...", "explore.trending": "ट्रेंडिंग", "explore.people": "लोग", "explore.noResults": "कोई परिणाम नहीं मिला", "explore.noResultsDesc": "कुछ और खोजने का प्रयास करें।",
    "editProfile.title": "प्रोफ़ाइल संपादित करें", "editProfile.name": "नाम", "editProfile.bio": "बायो", "editProfile.location": "स्थान", "editProfile.website": "वेबसाइट", "editProfile.save": "सहेजें", "editProfile.saving": "सहेजा जा रहा है...",
    "subscription.title": "प्रीमियम", "subscription.subtitle": "वह योजना चुनें जो आपके लिए काम करे", "subscription.currentPlan": "वर्तमान योजना", "subscription.upgrade": "अपग्रेड", "subscription.subscribe": "सदस्यता लें", "subscription.managePlan": "योजना प्रबंधित करें", "subscription.tweetsUsed": "ट्वीट उपयोग किए", "subscription.tweetsRemaining": "ट्वीट शेष", "subscription.unlimited": "असीमित", "subscription.perMonth": "/माह", "subscription.free": "मुफ्त",
    "landing.happening": "अभी क्या हो रहा है", "landing.joinToday": "आज ही शामिल हों।", "landing.signUpGoogle": "Google से साइन अप करें", "landing.or": "या", "landing.createAccount": "अकाउंट बनाएं", "landing.terms": "सेवा की शर्तें", "landing.privacy": "गोपनीयता नीति", "landing.cookies": "कुकी उपयोग", "landing.termsText": "साइन अप करके, आप सहमत हैं", "landing.and": "और", "landing.including": "सहित", "landing.alreadyAccount": "पहले से खाता है?", "landing.signIn": "साइन इन",
    "rightSidebar.search": "खोजें", "rightSidebar.subscribePremium": "प्रीमियम की सदस्यता लें", "rightSidebar.subscribePremiumDesc": "नई सुविधाओं को अनलॉक करने के लिए सदस्यता लें।", "rightSidebar.planActive": "योजना सक्रिय", "rightSidebar.managePlanDesc": "अपनी सदस्यता प्रबंधित करें या अपग्रेड करें।", "rightSidebar.managePlan": "योजना प्रबंधित करें", "rightSidebar.subscribe": "सदस्यता लें", "rightSidebar.trendsForYou": "आपके लिए ट्रेंड", "rightSidebar.showMore": "और दिखाएं", "rightSidebar.youMightLike": "आपको पसंद आ सकते हैं", "rightSidebar.follow": "फ़ॉलो करें", "rightSidebar.following": "फ़ॉलोइंग",
    "common.loading": "लोड हो रहा है...", "common.error": "कुछ गलत हो गया", "common.retry": "पुनः प्रयास करें", "common.close": "बंद करें", "common.save": "सहेजें", "common.cancel": "रद्द करें", "common.delete": "हटाएं", "common.edit": "संपादित करें", "common.posts": "पोस्ट",
  },

  pt: {
    "sidebar.home": "Início", "sidebar.explore": "Explorar", "sidebar.notifications": "Notificações", "sidebar.messages": "Mensagens", "sidebar.bookmarks": "Salvos", "sidebar.premium": "Premium", "sidebar.communities": "Comunidades", "sidebar.profile": "Perfil", "sidebar.more": "Mais", "sidebar.post": "Postar", "sidebar.settings": "Configurações e privacidade", "sidebar.helpCenter": "Central de Ajuda", "sidebar.logout": "Sair",
    "feed.home": "Início", "feed.forYou": "Para você", "feed.following": "Seguindo", "feed.loading": "Carregando publicações...", "feed.welcomeFollowing": "Bem-vindo ao seu feed de Seguindo", "feed.followPeople": "Siga pessoas para começar a ver suas publicações aqui.", "feed.noPosts": "Nenhuma publicação ainda", "feed.noFollowingPosts": "Nenhuma das pessoas que você segue publicou ainda.", "feed.beFirst": "Seja o primeiro a publicar algo!",
    "composer.placeholder": "O que está acontecendo?!", "composer.post": "Postar", "composer.posting": "Postando...",
    "tweet.reply": "Responder", "tweet.repost": "Repostar", "tweet.like": "Curtir", "tweet.bookmark": "Salvar", "tweet.share": "Compartilhar", "tweet.replies": "respostas", "tweet.viewReplies": "Ver respostas", "tweet.hideReplies": "Ocultar respostas", "tweet.replyPlaceholder": "Publique sua resposta",
    "settings.title": "Configurações", "settings.subtitle": "Gerencie as preferências da sua conta", "settings.yourAccount": "Sua Conta", "settings.editProfile": "Editar Informações do Perfil", "settings.editProfileDesc": "Bio, localização, site, avatar", "settings.privacyPrefs": "Privacidade e Preferências", "settings.privateAccount": "Conta Privada", "settings.privateAccountDesc": "Apenas seguidores aprovados podem ver publicações", "settings.pushNotifications": "Notificações Push", "settings.pushNotificationsDesc": "Receber alertas de curtidas e respostas", "settings.logOut": "Sair", "settings.privacyUpdated": "Configuração de privacidade atualizada", "settings.notificationUpdated": "Configuração de notificação atualizada", "settings.language": "Idioma", "settings.languageDesc": "Alterar idioma de exibição", "settings.currentLanguage": "Atual",
    "lang.title": "Idioma de Exibição", "lang.subtitle": "Selecione seu idioma preferido. Verificação necessária.", "lang.current": "Atual", "lang.switchTo": "Mudar para", "lang.verifyEmail": "OTP enviado para seu e-mail registrado", "lang.verifyMobile": "OTP enviado para seu celular registrado", "lang.enterOtp": "Digite o código de verificação", "lang.verify": "Verificar e Aplicar", "lang.verifying": "Verificando...", "lang.sending": "Enviando OTP...", "lang.resend": "Reenviar OTP", "lang.success": "Idioma alterado com sucesso!", "lang.phoneRequired": "Número de telefone necessário", "lang.phoneRequiredDesc": "Um número de telefone é necessário para verificação de idioma.", "lang.phonePlaceholder": "Digite o número do telefone", "lang.phoneSave": "Salvar e Continuar", "lang.phoneSaving": "Salvando...", "lang.cancel": "Cancelar", "lang.back": "Voltar",
    "notifications.title": "Notificações", "notifications.all": "Todas", "notifications.social": "Social", "notifications.keyword": "Alertas de Palavras", "notifications.noNotifications": "Nada para ver aqui — ainda", "notifications.noNotificationsDesc": "Quando alguém interagir com suas publicações, aparecerá aqui.", "notifications.noKeyword": "Sem alertas de palavras-chave ainda", "notifications.noKeywordDesc": "Quando tweets corresponderem às suas palavras-chave, aparecerão aqui.", "notifications.clearAll": "Limpar tudo", "notifications.likedPost": "curtiu sua publicação", "notifications.followedYou": "seguiu você", "notifications.reposted": "repostou sua publicação", "notifications.replied": "respondeu à sua publicação", "notifications.mentioned": "mencionou você",
    "messages.title": "Mensagens", "messages.search": "Pesquisar Mensagens Diretas", "messages.selectConvo": "Selecione uma conversa", "messages.selectConvoDesc": "Escolha entre suas conversas existentes ou inicie uma nova.", "messages.newMessage": "Nova mensagem", "messages.typeMessage": "Iniciar uma nova mensagem", "messages.send": "Enviar",
    "bookmarks.title": "Salvos", "bookmarks.loading": "Carregando salvos...", "bookmarks.empty": "Salve publicações para depois", "bookmarks.emptyDesc": "Não deixe as boas escaparem! Salve publicações para encontrá-las facilmente no futuro.",
    "profile.posts": "Publicações", "profile.replies": "Respostas", "profile.likes": "Curtidas", "profile.followers": "Seguidores", "profile.following": "Seguindo", "profile.follow": "Seguir", "profile.unfollow": "Deixar de seguir", "profile.editProfile": "Editar perfil", "profile.loginHistory": "Histórico de login", "profile.joined": "Entrou em", "profile.noPosts": "Nenhuma publicação ainda", "profile.noPostsDesc": "Quando você publicar algo, aparecerá aqui.",
    "explore.title": "Explorar", "explore.searchPlaceholder": "Pesquisar publicações, pessoas...", "explore.trending": "Em Alta", "explore.people": "Pessoas", "explore.noResults": "Nenhum resultado encontrado", "explore.noResultsDesc": "Tente pesquisar algo diferente.",
    "editProfile.title": "Editar perfil", "editProfile.name": "Nome", "editProfile.bio": "Bio", "editProfile.location": "Localização", "editProfile.website": "Site", "editProfile.save": "Salvar", "editProfile.saving": "Salvando...",
    "subscription.title": "Premium", "subscription.subtitle": "Escolha o plano que funciona para você", "subscription.currentPlan": "Plano Atual", "subscription.upgrade": "Upgrade", "subscription.subscribe": "Assinar", "subscription.managePlan": "Gerenciar Plano", "subscription.tweetsUsed": "tweets usados", "subscription.tweetsRemaining": "tweets restantes", "subscription.unlimited": "Ilimitado", "subscription.perMonth": "/mês", "subscription.free": "Grátis",
    "landing.happening": "Acontecendo agora", "landing.joinToday": "Junte-se hoje.", "landing.signUpGoogle": "Registrar com Google", "landing.or": "ou", "landing.createAccount": "Criar conta", "landing.terms": "Termos de Serviço", "landing.privacy": "Política de Privacidade", "landing.cookies": "Uso de Cookies", "landing.termsText": "Ao se registrar, você concorda com os", "landing.and": "e", "landing.including": "incluindo", "landing.alreadyAccount": "Já tem uma conta?", "landing.signIn": "Entrar",
    "rightSidebar.search": "Pesquisar", "rightSidebar.subscribePremium": "Assine o Premium", "rightSidebar.subscribePremiumDesc": "Assine para desbloquear novos recursos e postar mais tweets.", "rightSidebar.planActive": "Plano Ativo", "rightSidebar.managePlanDesc": "Gerencie sua assinatura ou faça upgrade.", "rightSidebar.managePlan": "Gerenciar Plano", "rightSidebar.subscribe": "Assinar", "rightSidebar.trendsForYou": "Tendências para você", "rightSidebar.showMore": "Mostrar mais", "rightSidebar.youMightLike": "Você pode gostar", "rightSidebar.follow": "Seguir", "rightSidebar.following": "Seguindo",
    "common.loading": "Carregando...", "common.error": "Algo deu errado", "common.retry": "Tentar novamente", "common.close": "Fechar", "common.save": "Salvar", "common.cancel": "Cancelar", "common.delete": "Excluir", "common.edit": "Editar", "common.posts": "publicações",
  },

  zh: {
    "sidebar.home": "首页", "sidebar.explore": "探索", "sidebar.notifications": "通知", "sidebar.messages": "消息", "sidebar.bookmarks": "书签", "sidebar.premium": "高级版", "sidebar.communities": "社区", "sidebar.profile": "个人资料", "sidebar.more": "更多", "sidebar.post": "发帖", "sidebar.settings": "设置和隐私", "sidebar.helpCenter": "帮助中心", "sidebar.logout": "退出登录",
    "feed.home": "首页", "feed.forYou": "推荐", "feed.following": "关注", "feed.loading": "正在加载推文...", "feed.welcomeFollowing": "欢迎来到你的关注动态", "feed.followPeople": "关注一些人来开始在这里看到他们的帖子。", "feed.noPosts": "暂无帖子", "feed.noFollowingPosts": "你关注的人还没有发过帖子。", "feed.beFirst": "成为第一个发帖的人！",
    "composer.placeholder": "有什么新鲜事？！", "composer.post": "发帖", "composer.posting": "发送中...",
    "tweet.reply": "回复", "tweet.repost": "转发", "tweet.like": "喜欢", "tweet.bookmark": "书签", "tweet.share": "分享", "tweet.replies": "回复", "tweet.viewReplies": "查看回复", "tweet.hideReplies": "隐藏回复", "tweet.replyPlaceholder": "发布你的回复",
    "settings.title": "设置", "settings.subtitle": "管理你的账户偏好", "settings.yourAccount": "你的账户", "settings.editProfile": "编辑个人资料", "settings.editProfileDesc": "简介、位置、网站、头像", "settings.privacyPrefs": "隐私和偏好", "settings.privateAccount": "私密账户", "settings.privateAccountDesc": "只有被批准的关注者才能查看帖子", "settings.pushNotifications": "推送通知", "settings.pushNotificationsDesc": "接收点赞和回复的提醒", "settings.logOut": "退出登录", "settings.privacyUpdated": "隐私设置已更新", "settings.notificationUpdated": "通知设置已更新", "settings.language": "语言", "settings.languageDesc": "更改显示语言", "settings.currentLanguage": "当前",
    "lang.title": "显示语言", "lang.subtitle": "选择您的首选语言。需要验证。", "lang.current": "当前", "lang.switchTo": "切换到", "lang.verifyEmail": "OTP已发送到您的注册邮箱", "lang.verifyMobile": "OTP已发送到您的注册手机", "lang.enterOtp": "输入验证码", "lang.verify": "验证并应用", "lang.verifying": "验证中...", "lang.sending": "发送OTP中...", "lang.resend": "重新发送OTP", "lang.success": "语言更改成功！", "lang.phoneRequired": "需要手机号码", "lang.phoneRequiredDesc": "语言验证需要手机号码。", "lang.phonePlaceholder": "输入手机号码", "lang.phoneSave": "保存并继续", "lang.phoneSaving": "保存中...", "lang.cancel": "取消", "lang.back": "返回",
    "notifications.title": "通知", "notifications.all": "全部", "notifications.social": "社交", "notifications.keyword": "关键词提醒", "notifications.noNotifications": "这里还没有内容", "notifications.noNotificationsDesc": "当有人与你的帖子互动时，会显示在这里。", "notifications.noKeyword": "还没有关键词提醒", "notifications.noKeywordDesc": "当推文匹配你的关键词时，会显示在这里。", "notifications.clearAll": "全部清除", "notifications.likedPost": "喜欢了你的帖子", "notifications.followedYou": "关注了你", "notifications.reposted": "转发了你的帖子", "notifications.replied": "回复了你的帖子", "notifications.mentioned": "提到了你",
    "messages.title": "消息", "messages.search": "搜索私信", "messages.selectConvo": "选择一个对话", "messages.selectConvoDesc": "从现有对话中选择或开始新的对话。", "messages.newMessage": "新消息", "messages.typeMessage": "开始新消息", "messages.send": "发送",
    "bookmarks.title": "书签", "bookmarks.loading": "正在加载书签...", "bookmarks.empty": "保存帖子以便稍后查看", "bookmarks.emptyDesc": "别让好帖子溜走！收藏帖子以便将来轻松找到。",
    "profile.posts": "帖子", "profile.replies": "回复", "profile.likes": "喜欢", "profile.followers": "粉丝", "profile.following": "关注", "profile.follow": "关注", "profile.unfollow": "取消关注", "profile.editProfile": "编辑个人资料", "profile.joined": "加入于", "profile.noPosts": "暂无帖子", "profile.noPostsDesc": "当你发帖时，会显示在这里。",
    "explore.title": "探索", "explore.searchPlaceholder": "搜索帖子、用户...", "explore.trending": "热门", "explore.people": "用户", "explore.noResults": "未找到结果", "explore.noResultsDesc": "尝试搜索其他内容。",
    "editProfile.title": "编辑个人资料", "editProfile.name": "名称", "editProfile.bio": "简介", "editProfile.location": "位置", "editProfile.website": "网站", "editProfile.save": "保存", "editProfile.saving": "保存中...",
    "subscription.title": "高级版", "subscription.subtitle": "选择适合你的计划", "subscription.currentPlan": "当前计划", "subscription.upgrade": "升级", "subscription.subscribe": "订阅", "subscription.managePlan": "管理计划", "subscription.tweetsUsed": "已用推文", "subscription.tweetsRemaining": "剩余推文", "subscription.unlimited": "无限", "subscription.perMonth": "/月", "subscription.free": "免费",
    "landing.happening": "看看正在发生什么", "landing.joinToday": "立即加入。", "landing.signUpGoogle": "使用Google注册", "landing.or": "或", "landing.createAccount": "创建账户", "landing.terms": "服务条款", "landing.privacy": "隐私政策", "landing.cookies": "Cookie使用", "landing.termsText": "注册即表示你同意", "landing.and": "和", "landing.including": "包括", "landing.alreadyAccount": "已有账户？", "landing.signIn": "登录",
    "rightSidebar.search": "搜索", "rightSidebar.subscribePremium": "订阅高级版", "rightSidebar.subscribePremiumDesc": "订阅以解锁新功能并发布更多推文。", "rightSidebar.planActive": "计划已激活", "rightSidebar.managePlanDesc": "管理你的订阅或升级你的计划。", "rightSidebar.managePlan": "管理计划", "rightSidebar.subscribe": "订阅", "rightSidebar.trendsForYou": "为你推荐的趋势", "rightSidebar.showMore": "显示更多", "rightSidebar.youMightLike": "你可能喜欢", "rightSidebar.follow": "关注", "rightSidebar.following": "关注中",
    "common.loading": "加载中...", "common.error": "出错了", "common.retry": "重试", "common.close": "关闭", "common.save": "保存", "common.cancel": "取消", "common.delete": "删除", "common.edit": "编辑", "common.posts": "帖子",
  },

  fr: {
    "sidebar.home": "Accueil", "sidebar.explore": "Explorer", "sidebar.notifications": "Notifications", "sidebar.messages": "Messages", "sidebar.bookmarks": "Signets", "sidebar.premium": "Premium", "sidebar.communities": "Communautés", "sidebar.profile": "Profil", "sidebar.more": "Plus", "sidebar.post": "Publier", "sidebar.settings": "Paramètres et confidentialité", "sidebar.helpCenter": "Centre d'aide", "sidebar.logout": "Se déconnecter",
    "feed.home": "Accueil", "feed.forYou": "Pour vous", "feed.following": "Abonnements", "feed.loading": "Chargement des publications...", "feed.welcomeFollowing": "Bienvenue dans votre fil d'abonnements", "feed.followPeople": "Suivez des personnes pour voir leurs publications ici.", "feed.noPosts": "Aucune publication pour le moment", "feed.noFollowingPosts": "Aucune des personnes que vous suivez n'a encore publié.", "feed.beFirst": "Soyez le premier à publier quelque chose !",
    "composer.placeholder": "Quoi de neuf ?!", "composer.post": "Publier", "composer.posting": "Publication...",
    "tweet.reply": "Répondre", "tweet.repost": "Republier", "tweet.like": "Aimer", "tweet.bookmark": "Signet", "tweet.share": "Partager", "tweet.replies": "réponses", "tweet.viewReplies": "Voir les réponses", "tweet.hideReplies": "Masquer les réponses", "tweet.replyPlaceholder": "Publiez votre réponse",
    "settings.title": "Paramètres", "settings.subtitle": "Gérez les préférences de votre compte", "settings.yourAccount": "Votre Compte", "settings.editProfile": "Modifier les informations du profil", "settings.editProfileDesc": "Bio, localisation, site web, avatar", "settings.privacyPrefs": "Confidentialité et Préférences", "settings.privateAccount": "Compte Privé", "settings.privateAccountDesc": "Seuls les abonnés approuvés peuvent voir les publications", "settings.pushNotifications": "Notifications Push", "settings.pushNotificationsDesc": "Recevoir des alertes pour les j'aime et réponses", "settings.logOut": "Se Déconnecter", "settings.privacyUpdated": "Paramètre de confidentialité mis à jour", "settings.notificationUpdated": "Paramètre de notification mis à jour", "settings.language": "Langue", "settings.languageDesc": "Changer la langue d'affichage", "settings.currentLanguage": "Actuelle",
    "lang.title": "Langue d'affichage", "lang.subtitle": "Sélectionnez votre langue préférée. Vérification requise.", "lang.current": "Actuelle", "lang.switchTo": "Passer à", "lang.verifyEmail": "OTP envoyé à votre adresse e-mail enregistrée", "lang.verifyMobile": "OTP envoyé à votre numéro mobile enregistré", "lang.enterOtp": "Entrez le code de vérification", "lang.verify": "Vérifier et Appliquer", "lang.verifying": "Vérification...", "lang.sending": "Envoi de l'OTP...", "lang.resend": "Renvoyer l'OTP", "lang.success": "Langue changée avec succès !", "lang.phoneRequired": "Numéro de téléphone requis", "lang.phoneRequiredDesc": "Un numéro de téléphone est requis pour la vérification de la langue.", "lang.phonePlaceholder": "Entrez le numéro de téléphone", "lang.phoneSave": "Enregistrer et Continuer", "lang.phoneSaving": "Enregistrement...", "lang.cancel": "Annuler", "lang.back": "Retour",
    "notifications.title": "Notifications", "notifications.all": "Toutes", "notifications.social": "Social", "notifications.keyword": "Alertes mots-clés", "notifications.noNotifications": "Rien à voir ici — pour l'instant", "notifications.noNotificationsDesc": "Quand quelqu'un interagit avec vos publications, ça apparaîtra ici.", "notifications.noKeyword": "Pas encore d'alertes mots-clés", "notifications.noKeywordDesc": "Quand des tweets correspondent à vos mots-clés, ils apparaîtront ici.", "notifications.clearAll": "Tout effacer", "notifications.likedPost": "a aimé votre publication", "notifications.followedYou": "vous a suivi", "notifications.reposted": "a republié votre publication", "notifications.replied": "a répondu à votre publication", "notifications.mentioned": "vous a mentionné",
    "messages.title": "Messages", "messages.search": "Rechercher des messages directs", "messages.selectConvo": "Sélectionnez une conversation", "messages.selectConvoDesc": "Choisissez parmi vos conversations existantes ou commencez-en une nouvelle.", "messages.newMessage": "Nouveau message", "messages.typeMessage": "Commencer un nouveau message", "messages.send": "Envoyer",
    "bookmarks.title": "Signets", "bookmarks.loading": "Chargement des signets...", "bookmarks.empty": "Sauvegardez des publications pour plus tard", "bookmarks.emptyDesc": "Ne laissez pas les bonnes s'envoler ! Ajoutez des signets pour les retrouver facilement.",
    "profile.posts": "Publications", "profile.replies": "Réponses", "profile.likes": "J'aime", "profile.followers": "Abonnés", "profile.following": "Abonnements", "profile.follow": "Suivre", "profile.unfollow": "Ne plus suivre", "profile.editProfile": "Modifier le profil", "profile.loginHistory": "Historique de connexion", "profile.joined": "Inscrit en", "profile.noPosts": "Aucune publication", "profile.noPostsDesc": "Quand vous publierez quelque chose, ça apparaîtra ici.",
    "explore.title": "Explorer", "explore.searchPlaceholder": "Rechercher des publications, personnes...", "explore.trending": "Tendances", "explore.people": "Personnes", "explore.noResults": "Aucun résultat trouvé", "explore.noResultsDesc": "Essayez de rechercher autre chose.",
    "editProfile.title": "Modifier le profil", "editProfile.name": "Nom", "editProfile.bio": "Bio", "editProfile.location": "Localisation", "editProfile.website": "Site web", "editProfile.save": "Enregistrer", "editProfile.saving": "Enregistrement...",
    "subscription.title": "Premium", "subscription.subtitle": "Choisissez le plan qui vous convient", "subscription.currentPlan": "Plan Actuel", "subscription.upgrade": "Améliorer", "subscription.subscribe": "S'abonner", "subscription.managePlan": "Gérer le Plan", "subscription.tweetsUsed": "tweets utilisés", "subscription.tweetsRemaining": "tweets restants", "subscription.unlimited": "Illimité", "subscription.perMonth": "/mois", "subscription.free": "Gratuit",
    "landing.happening": "Ça se passe maintenant", "landing.joinToday": "Rejoignez-nous aujourd'hui.", "landing.signUpGoogle": "S'inscrire avec Google", "landing.or": "ou", "landing.createAccount": "Créer un compte", "landing.terms": "Conditions d'utilisation", "landing.privacy": "Politique de confidentialité", "landing.cookies": "Utilisation des cookies", "landing.termsText": "En vous inscrivant, vous acceptez les", "landing.and": "et", "landing.including": "y compris", "landing.alreadyAccount": "Vous avez déjà un compte ?", "landing.signIn": "Se connecter",
    "rightSidebar.search": "Rechercher", "rightSidebar.subscribePremium": "Abonnez-vous à Premium", "rightSidebar.subscribePremiumDesc": "Abonnez-vous pour débloquer de nouvelles fonctionnalités.", "rightSidebar.planActive": "Plan Actif", "rightSidebar.managePlanDesc": "Gérez votre abonnement ou améliorez votre plan.", "rightSidebar.managePlan": "Gérer le Plan", "rightSidebar.subscribe": "S'abonner", "rightSidebar.trendsForYou": "Tendances pour vous", "rightSidebar.showMore": "Afficher plus", "rightSidebar.youMightLike": "Vous pourriez aimer", "rightSidebar.follow": "Suivre", "rightSidebar.following": "Abonné",
    "common.loading": "Chargement...", "common.error": "Une erreur est survenue", "common.retry": "Réessayer", "common.close": "Fermer", "common.save": "Enregistrer", "common.cancel": "Annuler", "common.delete": "Supprimer", "common.edit": "Modifier", "common.posts": "publications",
  },
};

export default translations;
