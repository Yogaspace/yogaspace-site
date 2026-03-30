/**
 * Webhook interceptor for Tilda forms -> 1C:Fitness
 * Intercepts form submissions and sends data to the 1C webhook
 */
(function() {
  var WEBHOOK_URL = 'https://cloud.1c.fitness/api/hs/lead/Tilda/d76baae4-1cae-4f32-8a19-c7d3bc90318c';

  // Wait for tildaForm to be available
  function initWebhook() {
    if (!window.tildaForm || !window.tildaForm.send) {
      setTimeout(initWebhook, 500);
      return;
    }

    // Store original send function
    var originalSend = window.tildaForm.send;

    // Override tildaForm.send
    window.tildaForm.send = function(formNode, btnSubmitNode, formType, formKey) {
      // Collect form data
      var form = formNode;
      if (typeof formNode === 'string') {
        form = document.getElementById(formNode);
      }
      if (!form) {
        return originalSend.apply(this, arguments);
      }

      var formData = {};
      var inputs = form.querySelectorAll('input, textarea, select');
      for (var i = 0; i < inputs.length; i++) {
        var input = inputs[i];
        var name = input.getAttribute('name');
        var value = input.value;

        if (!name) continue;
        // Skip hidden tilda system fields, spec fields, and honeypot
        if (name.indexOf('tildaspec-') === 0) continue;
        if (name === 'form-spec-comments') continue;
        if (name === 'formservices[]') continue;

        // Handle checkboxes
        if (input.type === 'checkbox') {
          if (input.checked) {
            formData[name] = value || 'on';
          }
          continue;
        }
        // Handle radio
        if (input.type === 'radio') {
          if (input.checked) {
            formData[name] = value;
          }
          continue;
        }

        if (value && value.trim()) {
          formData[name] = value.trim();
        }
      }

      // Add form name
      var formNameInput = form.querySelector('input[name="tildaspec-formname"]');
      if (formNameInput && formNameInput.value) {
        formData['formname'] = formNameInput.value;
      }

      // Send to 1C webhook (fire and forget, don't block original flow)
      try {
        var params = [];
        for (var key in formData) {
          if (formData.hasOwnProperty(key)) {
            params.push(encodeURIComponent(key) + '=' + encodeURIComponent(formData[key]));
          }
        }
        var body = params.join('&');

        var xhr = new XMLHttpRequest();
        xhr.open('POST', WEBHOOK_URL, true);
        xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
        xhr.send(body);

        console.log('[YogaSpace] Form data sent to 1C webhook:', formData);
      } catch(e) {
        console.error('[YogaSpace] Webhook error:', e);
      }

      // Call original Tilda send (for success message display etc.)
      return originalSend.apply(this, arguments);
    };

    console.log('[YogaSpace] Webhook interceptor initialized');
  }

  // Start initialization
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      setTimeout(initWebhook, 1000);
    });
  } else {
    setTimeout(initWebhook, 1000);
  }
})();
