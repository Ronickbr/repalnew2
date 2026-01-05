main.js?attr=1L6j5M-IJae6JrzZ5aYe3pJqsjVQF4ntFhzi7KB_8hNuNO0_GdkrPRMHRyDGdhzZkXGnqqLyRp9PmVixRX8LCw:4166  POST https://urncvsszviybjtyjnaed.supabase.co/rest/v1/promotions?columns=%22title%22%2C%22description%22%2C%22discount_percentage%22%2C%22image_url%22%2C%22link_url%22%2C%22start_date%22%2C%22end_date%22%2C%22active%22%2C%22trigger_type%22%2C%22trigger_value%22%2C%22template_type%22%2C%22content_layout%22 400 (Bad Request)
fetchCallImpl @ main.js?attr=1L6j5M-IJae6JrzZ5aYe3pJqsjVQF4ntFhzi7KB_8hNuNO0_GdkrPRMHRyDGdhzZkXGnqqLyRp9PmVixRX8LCw:4166
fetch @ main.js?attr=1L6j5M-IJae6JrzZ5aYe3pJqsjVQF4ntFhzi7KB_8hNuNO0_GdkrPRMHRyDGdhzZkXGnqqLyRp9PmVixRX8LCw:4172
(anonymous) @ @supabase_supabase-js.js?v=6da5d7ba:11441
(anonymous) @ @supabase_supabase-js.js?v=6da5d7ba:11455
await in (anonymous)
then @ @supabase_supabase-js.js?v=6da5d7ba:305
PromotionManager.tsx:261 Erro ao salvar promoção: {code: '23502', details: null, hint: null, message: 'null value in column "discount_percentage" of relation "promotions" violates not-null constraint'}
handleSubmit @ PromotionManager.tsx:261
await in handleSubmit
callCallback2 @ chunk-SXRIVT2P.js?v=6da5d7ba:3680
invokeGuardedCallbackDev @ chunk-SXRIVT2P.js?v=6da5d7ba:3705
invokeGuardedCallback @ chunk-SXRIVT2P.js?v=6da5d7ba:3739
invokeGuardedCallbackAndCatchFirstError @ chunk-SXRIVT2P.js?v=6da5d7ba:3742
executeDispatch @ chunk-SXRIVT2P.js?v=6da5d7ba:7046
processDispatchQueueItemsInOrder @ chunk-SXRIVT2P.js?v=6da5d7ba:7066
processDispatchQueue @ chunk-SXRIVT2P.js?v=6da5d7ba:7075
dispatchEventsForPlugins @ chunk-SXRIVT2P.js?v=6da5d7ba:7083
(anonymous) @ chunk-SXRIVT2P.js?v=6da5d7ba:7206
batchedUpdates$1 @ chunk-SXRIVT2P.js?v=6da5d7ba:18966
batchedUpdates @ chunk-SXRIVT2P.js?v=6da5d7ba:3585
dispatchEventForPluginEventSystem @ chunk-SXRIVT2P.js?v=6da5d7ba:7205
dispatchEventWithEnableCapturePhaseSelectiveHydrationWithoutDiscreteEventReplay @ chunk-SXRIVT2P.js?v=6da5d7ba:5484
dispatchEvent @ chunk-SXRIVT2P.js?v=6da5d7ba:5478
dispatchDiscreteEvent @ chunk-SXRIVT2P.js?v=6da5d7ba:5455
