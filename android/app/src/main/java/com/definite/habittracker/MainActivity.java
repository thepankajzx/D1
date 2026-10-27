package com.definite.habittracker;

import android.content.Intent;
import android.os.Bundle;
import android.webkit.WebSettings;
import android.webkit.WebView;
import androidx.activity.OnBackPressedCallback;
import androidx.core.graphics.Insets;
import androidx.core.splashscreen.SplashScreen;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowInsetsCompat;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        // Register custom native notification plugin
        registerPlugin(D1NotificationPlugin.class);

        // Initialize AndroidX SplashScreen before super.onCreate for instant smooth dark splash
        SplashScreen.installSplashScreen(this);

        super.onCreate(savedInstanceState);
        handleNotificationIntent(getIntent());

        // Ensure window decorView and WebView immediately have day mode background by default
        try {
            getWindow().getDecorView().setBackgroundColor(android.graphics.Color.parseColor("#F7FAF8"));
        } catch (Exception ignored) {}

        // Handle edge-to-edge status bar & display cutout insets (punch-holes, notches, dynamic islands)
        try {
            ViewCompat.setOnApplyWindowInsetsListener(findViewById(android.R.id.content), (view, windowInsets) -> {
                Insets insets = windowInsets.getInsets(
                    WindowInsetsCompat.Type.statusBars() | WindowInsetsCompat.Type.displayCutout()
                );
                view.setPadding(0, insets.top, 0, 0);
                return windowInsets;
            });
        } catch (Exception ignored) {}

        if (getBridge() != null && getBridge().getWebView() != null) {
            WebView webView = getBridge().getWebView();
            try {
                webView.setBackgroundColor(android.graphics.Color.parseColor("#F7FAF8"));
            } catch (Exception ignored) {}
        }

        // Native Predictive Back & Hardware Back Button Interceptor
        getOnBackPressedDispatcher().addCallback(this, new OnBackPressedCallback(true) {
            @Override
            public void handleOnBackPressed() {
                if (getBridge() != null && getBridge().getWebView() != null) {
                    WebView webView = getBridge().getWebView();
                    // 1. Dispatch custom event so open dropdowns / accordions / modals can consume it
                    webView.evaluateJavascript(
                        "(function() {" +
                        "  var evt = new CustomEvent('d1_hardware_back', { cancelable: true });" +
                        "  var wasConsumed = !window.dispatchEvent(evt);" +
                        "  return wasConsumed;" +
                        "})()",
                        value -> {
                            if (!"true".equals(value)) {
                                runOnUiThread(() -> {
                                    // 2. Check current location hash
                                    webView.evaluateJavascript(
                                        "(function() {" +
                                        "  if (window.location.hash && window.location.hash !== '#/' && window.location.hash !== '#') {" +
                                        "    if (window.history.length > 1 && window.history.state && window.history.state.idx > 0) {" +
                                        "      window.history.back();" +
                                        "    } else {" +
                                        "      window.location.hash = '#/';" +
                                        "    }" +
                                        "    return 'navigated_back';" +
                                        "  } else {" +
                                        "    return 'exit';" +
                                        "  }" +
                                        "})()",
                                        navResult -> {
                                            if ("\"exit\"".equals(navResult) || "exit".equals(navResult)) {
                                                // When on root (Today), move app to background instead of destroying process
                                                // This eliminates cold start delay and white screen when user returns!
                                                runOnUiThread(() -> moveTaskToBack(true));
                                            }
                                        }
                                    );
                                });
                            }
                        }
                    );
                } else {
                    moveTaskToBack(true);
                }
            }
        });
    }

    @Override
    public void onStart() {
        super.onStart();
        if (getBridge() != null && getBridge().getWebView() != null) {
            WebView webView = getBridge().getWebView();
            WebSettings settings = webView.getSettings();
            settings.setJavaScriptCanOpenWindowsAutomatically(true);
            settings.setSupportMultipleWindows(true);
            settings.setDomStorageEnabled(true);
            settings.setDatabaseEnabled(true);

            // Robust handler for external web links inside WebView
            webView.setWebViewClient(new com.getcapacitor.BridgeWebViewClient(getBridge()) {
                @Override
                public boolean shouldOverrideUrlLoading(WebView view, android.webkit.WebResourceRequest request) {
                    if (request != null && request.getUrl() != null) {
                        String url = request.getUrl().toString();
                        if (isExternalUrl(url)) {
                            try {
                                Intent intent = new Intent(Intent.ACTION_VIEW, request.getUrl());
                                intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                                view.getContext().startActivity(intent);
                                return true;
                            } catch (Exception ignored) {}
                        }
                    }
                    return super.shouldOverrideUrlLoading(view, request);
                }

                @Override
                public boolean shouldOverrideUrlLoading(WebView view, String url) {
                    if (url != null && isExternalUrl(url)) {
                        try {
                            Intent intent = new Intent(Intent.ACTION_VIEW, android.net.Uri.parse(url));
                            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                            view.getContext().startActivity(intent);
                            return true;
                        } catch (Exception ignored) {}
                    }
                    return super.shouldOverrideUrlLoading(view, url);
                }

                private boolean isExternalUrl(String url) {
                    return !url.startsWith("https://localhost") &&
                           !url.startsWith("http://localhost") &&
                           !url.startsWith("capacitor://") &&
                           !url.startsWith("about:blank") &&
                           (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("whatsapp://") || url.startsWith("instagram://"));
                }
            });

            // Robust handler for external links (WhatsApp, Instagram, Web)
            webView.setWebChromeClient(new com.getcapacitor.BridgeWebChromeClient(getBridge()) {
                @Override
                public boolean onCreateWindow(WebView view, boolean isDialog, boolean isUserGesture, android.os.Message resultMsg) {
                    android.content.Context ctx = view.getContext();
                    WebView.HitTestResult hit = view.getHitTestResult();
                    String extra = hit != null ? hit.getExtra() : null;
                    if (extra != null && (extra.startsWith("http://") || extra.startsWith("https://") || extra.startsWith("whatsapp://") || extra.startsWith("instagram://"))) {
                        try {
                            android.content.Intent intent = new android.content.Intent(android.content.Intent.ACTION_VIEW, android.net.Uri.parse(extra));
                            intent.addFlags(android.content.Intent.FLAG_ACTIVITY_NEW_TASK);
                            ctx.startActivity(intent);
                            return false;
                        } catch (Exception ignored) {}
                    }

                    WebView newWebView = new WebView(ctx);
                    newWebView.setWebViewClient(new android.webkit.WebViewClient() {
                        @Override
                        public boolean shouldOverrideUrlLoading(WebView v, android.webkit.WebResourceRequest req) {
                            if (req != null && req.getUrl() != null) {
                                try {
                                    android.content.Intent intent = new android.content.Intent(android.content.Intent.ACTION_VIEW, req.getUrl());
                                    intent.addFlags(android.content.Intent.FLAG_ACTIVITY_NEW_TASK);
                                    ctx.startActivity(intent);
                                } catch (Exception ignored) {}
                            }
                            return true;
                        }

                        @Override
                        public boolean shouldOverrideUrlLoading(WebView v, String url) {
                            if (url != null) {
                                try {
                                    android.content.Intent intent = new android.content.Intent(android.content.Intent.ACTION_VIEW, android.net.Uri.parse(url));
                                    intent.addFlags(android.content.Intent.FLAG_ACTIVITY_NEW_TASK);
                                    ctx.startActivity(intent);
                                } catch (Exception ignored) {}
                            }
                            return true;
                        }

                        @Override
                        public void onPageStarted(WebView v, String url, android.graphics.Bitmap favicon) {
                            if (url != null && !url.equals("about:blank")) {
                                try {
                                    android.content.Intent intent = new android.content.Intent(android.content.Intent.ACTION_VIEW, android.net.Uri.parse(url));
                                    intent.addFlags(android.content.Intent.FLAG_ACTIVITY_NEW_TASK);
                                    ctx.startActivity(intent);
                                } catch (Exception ignored) {}
                            }
                            super.onPageStarted(v, url, favicon);
                        }
                    });

                    if (resultMsg != null && resultMsg.obj instanceof WebView.WebViewTransport) {
                        WebView.WebViewTransport transport = (WebView.WebViewTransport) resultMsg.obj;
                        transport.setWebView(newWebView);
                        resultMsg.sendToTarget();
                        return true;
                    }

                    return super.onCreateWindow(view, isDialog, isUserGesture, resultMsg);
                }
            });
            // Match theme day background by default to prevent transient flash
            try {
                webView.setBackgroundColor(android.graphics.Color.parseColor("#F7FAF8"));
            } catch (Exception ignored) {}
        }
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        handleNotificationIntent(intent);
    }

    private void handleNotificationIntent(Intent intent) {
        if (intent != null && "OPEN_TODAY".equals(intent.getAction())) {
            if (getBridge() != null && getBridge().getWebView() != null) {
                runOnUiThread(() -> {
                    getBridge().getWebView().evaluateJavascript("window.location.hash = '#/';", null);
                });
            }
        }
    }
}
