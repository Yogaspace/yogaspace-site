/**
 * Webhook interceptor for Tilda forms -> 1C:Fitness
 * Uses hidden iframe form submission to avoid CORS preflight
 */
(function() {
  var WEBHOOK_URL = 'https://cloud.1c.fitness/api/hs/lead/Tilda/d76baae4-1cae-4f32-8a19-c7d3bc90318c';

  // Create hidden iframe for form submission (avoids CORS)
  var iframe = document.createElement('iframe');
  iframe.name = 'webhook_target_frame';
  iframe.style.display = 'none';
  document.body.appendChild(iframe);

  // Wait for tildaForm to be available
  function initWebhook() {
    if (!window.tildaForm || !window.tildaForm.send) {
      setTimeout(initWebhook, 500);
      return;
    }

    // Override tildaForm.send completely
    window.tildaForm.send = function(formNode, btnSubmitNode, formType, formKey) {
      var form = formNode;
      if (typeof formNode === 'string') {
        form = document.getElementById(formNode);
      }
      if (!form) return;

      // Collect form data
      var formData = {};
      var inputs = form.querySelectorAll('input, textarea, select');
      for (var i = 0; i < inputs.length; i++) {
        var input = inputs[i];
        var name = input.getAttribute('name');
        var value = input.value;

        if (!name) continue;
        if (name.indexOf('tildaspec-') === 0) continue;
        if (name === 'form-spec-comments') continue;
        if (name === 'formservices[]') continue;

        if (input.type === 'checkbox') {
          if (input.checked) formData[name] = value || 'on';
          continue;
        }
        if (input.type === 'radio') {
          if (input.checked) formData[name] = value;
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

      // Send via hidden form -> iframe (no CORS issues)
      try {
        var hiddenForm = document.createElement('form');
        hiddenForm.method = 'POST';
        hiddenForm.action = WEBHOOK_URL;
        hiddenForm.target = 'webhook_target_frame';
        hiddenForm.style.display = 'none';

        for (var key in formData) {
          if (formData.hasOwnProperty(key)) {
            var inp = document.createElement('input');
            inp.type = 'hidden';
            inp.name = key;
            inp.value = formData[key];
            hiddenForm.appendChild(inp);
          }
        }

        document.body.appendChild(hiddenForm);
        hiddenForm.submit();
        console.log('[YogaSpace] Form data sent to 1C webhook via iframe:', formData);

        // Remove hidden form after a short delay
        setTimeout(function() {
          if (hiddenForm.parentNode) {
            hiddenForm.parentNode.removeChild(hiddenForm);
          }
        }, 2000);
      } catch(e) {
        console.error('[YogaSpace] Webhook error:', e);
      }

      // Show success message after a brief delay
      setTimeout(function() {
        showSuccessMessage(form);
      }, 500);
    };

    console.log('[YogaSpace] Webhook interceptor initialized (iframe method)');
  }

  // Show success message after form submission
  function showSuccessMessage(form) {
    // Structure in Tilda:
    // <form>
    //   <div class="t-form__successbox" style="display:none;"> ... </div>
    //   <div class="t-form__inputsbox"> ... </div>
    //   <div class="t-form__submit"> ... </div>
    // </form>

    // 1. Find successbox inside the form
    var successBox = form.querySelector('.t-form__successbox');
    
    // 2. Hide the inputs box
    var inputsBox = form.querySelector('.t-form__inputsbox');
    if (inputsBox) {
      inputsBox.style.display = 'none';
    }

    // 3. Hide the submit button area
    var submitBox = form.querySelector('.t-form__submit');
    if (submitBox) {
      submitBox.style.display = 'none';
    }

    // 4. Hide any error boxes
    var errorBoxes = form.querySelectorAll('.t-form__errorbox-middle, .t-form__errorbox-bottom');
    for (var i = 0; i < errorBoxes.length; i++) {
      errorBoxes[i].style.display = 'none';
    }

    // 5. Show success box
    if (successBox) {
      // Tilda stores success text in data attribute - need to populate
      var successText = successBox.getAttribute('data-success-message') || 'Мы получили заявку и свяжемся с тобой :)';
      if (!successBox.innerHTML.trim()) {
        successBox.innerHTML = '<div style="padding:20px 0;font-size:18px;color:#333;text-align:center;">' + successText + '</div>';
      }
      successBox.style.display = 'block';
      console.log('[YogaSpace] Success message shown: ' + successText);
    } else {
      // Fallback: create a success message inside the form
      var msg = document.createElement('div');
      msg.className = 't-form__successbox';
      msg.style.cssText = 'display:block;padding:20px;text-align:center;color:#333;font-size:18px;';
      msg.innerHTML = 'Мы получили заявку и свяжемся с тобой :)';
      form.insertBefore(msg, form.firstChild);
      console.log('[YogaSpace] Fallback success message created');
    }

    // 6. Reset submit button state (in case it's visible)
    var btn = form.querySelector('.t-submit') || form.querySelector('button[type="submit"]');
    if (btn) {
      btn.classList.remove('t-btn_sending');
      var btnText = btn.querySelector('.t-submit__text');
      if (btnText) btnText.style.display = '';
    }
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
