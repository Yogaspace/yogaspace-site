/**
 * @param {object} response
 * @param {string} response.tokenExpired
 * @param {string} response.closePop
 * @param {string} response.lang.select_club
 * */

try {
	if (window.Fit) throw "Fitness already initialized";

	window.Fit1CApi = {};
	scriptFitApi = document.querySelector('[data-fit-salon-id]');
	window.dataLayer = window.dataLayer || [];
	window.Fit = {
		club_params: {not_show_link_1C: false, y_auth_client_id: false},
		sliderTitle: {},
		sliderContent: {},
		is_lk: false,
		host_type: '',
		source_dir: 'https://reservi.ru/widget-fit1c.v2',
		ajaxFilePatch: 'https://reservi.ru/api-fit1c/json/v2/',
		lang_code: 'ru',
		utm: {},
		lang: {'button_reserve': 'Бронирование', 'button_pay': 'Купить',},
		mask: {rule: '+7(nnn)nnn-nn-nn', placeholder: '+7(___)___-__-__'},
		maskSettingsRu: {dateFormat: 'дд-мм-гггг',},
		block: {
			head: {user_name: '[data-head-user-name]', user_logout: '[data-head-user-logout]',},
			trainer: '[data-trainer]',
			calendarContent: '[data-fit1c-calendar]',
			calendarSetButton: '[data-set-calendar-filter]',
			userCabinet: '[data-fit-cabinet]',
			userCabinetIndex: '[data-get-fit-index-lk]',
			userContent: '[data-fit-block-content]',
			userLeftMenu: '[data-fit-block-menu]',
			agreement: '[data-block-agreement]',
			reg: '[data-block-reg]',
			auth: '[data-block-auth]',
			userUpdate: '[data-block-update-user]',
			userCard: '[data-block-update-card]',
			payFormAdd: '[data-block-pay-form-add]',
			createPayOrder: '#create-payment-order',
			calendarSuccess: '#calendar-success',
			loaderHTML: '<div class="cssload-loader"></div>',
		},
		form: {
			reg: '[data-form-register]',
			rem: '[data-form-remember]',
			auth: '[data-form-auth]',
			userUpdate: '[data-form-update-user]',
			userUpdClub: '[data-form-upd-club]',
			userCard: '[data-form-update-card]',
			setAppForm: '[data-set-app-form]',
			payFormAdd: '[data-pay-form-add]',
			payDebts: '[data-pay-form-debts]',
		},
		formFields: {regBlock: {login: '[data-block-phone]', remConfirm: '[data-block-phone-confirm]', code: '[data-confirm-code]', userF: '[data-register-fields]', button: '[data-button-submit]',},},
		loading: {name: 'loading', class: '.loading',},
		class: {hide: 'hide-block', hideCalendarItem: 'hide-calendar-block', hideCalendarRow: 'hide-calendar-row',},
		cookie: {time: 60 * 60 * 24 * 30},
		salon_id: '',
		club_id: '',
		ajaxCallBody: '',
		ajaxCallAbort: function () { if (this.ajaxCallBody) this.ajaxCallBody.abort();},
		ajaxCall: function (url, data, func) {
			let _this = this;
			(function ($) { // для "ОСОБЫХ" wordpress сайтов
				data.clubs = window.Fit1CApi.data.clubs
				data.api_key = window.Fit.salon_id
				data.lang = window.Fit.lang_code
				data.lang_cookie = ''
				if (!data.host_type) data.host_type = _this.host_type

				if (typeof window.Fit1CApi.Cookie.get !== 'undefined') {
					if (!data.params.token) data.params.token = FitAuth.getUserToken()
					if (window.Fit1CApi.Cookie.get('Fit.lang')) {
						data.lang_cookie = true;
						data.lang = window.Fit1CApi.Cookie.get('Fit.lang');
					}
					if (window.Fit1CApi.Cookie.get('googleClientId')) data.params.googleClientId = window.Fit1CApi.Cookie.get('googleClientId');
					if (window.Fit1CApi.Cookie.get('yandexClientId')) data.params.yandexClientId = window.Fit1CApi.Cookie.get('yandexClientId');
					if (window.Fit1CApi.Cookie.get('Fit.U_TOKEN_MASTER')) data.params.token_master = window.Fit1CApi.Cookie.get('Fit.U_TOKEN_MASTER');
					// if ($.inArray(data.method, ['sendRegCode', 'checkRegCode',]) >= 0) _this.ajaxCallAbort();
				}
				if (['sendRegCode', 'checkRegCode',].indexOf(data.method) > -1) _this.ajaxCallAbort();
				if (!data.params.utm) data.params = window.Fit1CApi.getAppendUtm(data.params)

				_this.ajaxCallBody = $.ajax({
					url: url, data: data, type: 'POST', dataType: 'json', success: function (resp) {
						if (typeof resp === "object") {
							if (resp._print_console) console.log(resp._print_console)
							resp.method_send = data.method
						}
						if (window.Fit1CApi) window.Fit1CApi.callAfterAjax(resp, func, data);
					}, error: function (resp) { window.Fit1CApi.reset(resp) }
				});
			})(jQuery);
		},
		callXHR: function (url, data, func, method) {
			if (!url) url = '';
			if (!data) data = {};
			if (!method) method = 'POST';
			if (!data.host_type) data.host_type = this.host_type;

			let xhr = new XMLHttpRequest();
			xhr.open(method, url);
			xhr.onload = function () {if (xhr.readyState === 4 && xhr.status === 200) func(JSON.parse(xhr.response))}
			data.api_key = window.Fit.salon_id;
			xhr.send(JSON.stringify(data));

			return xhr;
		},
		getJs: function (src, async, runOnLoad) {
			let script = document.createElement('script');
			if (!async) async = false;
			if (runOnLoad) script.addEventListener("load", runOnLoad, false);

			script.src = src;
			script.async = async; // чтобы гарантировать порядок
			document.head.appendChild(script);
		},
		getCss: function (src, async) {
			let link = document.createElement('link');
			if (!async) async = false;

			link.rel = 'stylesheet';
			link.type = 'text/css';
			link.href = src;
			link.async = async; // чтобы гарантировать порядок
			document.head.appendChild(link);
		},
		loadCore: function () {
			let versionParts = jQuery.fn.jquery.split('.'); // Разделяем версию на части
			let majorVersion = parseInt(versionParts[0]); // Получаем главную версию
			if (majorVersion < 3) console.log('Версия jQuery ниже 3. Рекомендуется использовать версию 3 или выше.');
			if (document.head.innerHTML.match(/src="https:\/\/eu.reservi.ru\/widget-fit1c./i) || document.body.innerHTML.match(/src="https:\/\/eu.reservi.ru\/widget-fit1c./i)) {
				window.Fit.source_dir = window.Fit.source_dir.replace('reservi.ru', 'eu.reservi.ru')
				window.Fit.ajaxFilePatch = window.Fit.ajaxFilePatch.replace('reservi.ru', 'eu.reservi.ru')
				window.Fit.host_type = 'eu'
			}

			const data = window._ls.getItem('fit_v3_data_' + window.Fit.salon_id)
			const storageData = data ? JSON.parse(data) : []
			if (!!storageData.check_login) window.Fit.check_login = storageData.check_login
			let isLk = !!document.querySelectorAll(window.Fit.block.userCabinetIndex).length

			window.Fit.callXHR(window.Fit.ajaxFilePatch, {method: 'getLinks', params: {salon_id: window.Fit.salon_id, check_login: window.Fit.check_login, skipCustomStyle: window.Fit.skipCustomStyle,}, isLK: isLk}, function (resp) {
				for (let key in resp.css) {
					// console.log('load css:' + resp.css[key].src);
					window.Fit.getCss(resp.css[key].src, resp.css[key].async);
				}
				for (let key in resp.js) {
					// console.log('load js:' + resp.js[key].src);
					window.Fit.getJs(resp.js[key].src, resp.js[key].async, resp.js[key].initCore ? function () { window.Fit.initCore(); } : false);
				}
				if (resp.params) window.Fit.club_params = resp.params;
				if (resp.user_token) window.Fit.user_token = resp.user_token;
			});
		},
		initCore: function () {
			let _this = this;
			(function ($) { // для "ОСОБЫХ" wordpress сайтов
				// let dirLib = 'https://reservi.ru/widget-fit1c.v2/js',
				let dirLib = _this.source_dir + '/js',
					language = window.navigator ? (window.navigator.language || window.navigator.systemLanguage || window.navigator.userLanguage) : "en",
					lang_cookie = window.Fit1CApi.Cookie.get('Fit.lang') ? true : '';

				if (window.Fit.user_token) {
					FitAuth.setUserToken(window.Fit.user_token)
					window.Fit.user_token = ''
				}
				FitStorage.remove('check_login')
				if (FitAuth.getUserId()) window.dataLayer.push({'user_id': FitAuth.getUserId()});
				forEach(window.Fit1CApi.Tools.getQueryString(), function (val, name) {
					if (name.match(/utm_/)) {
						window.Fit1CApi.Cookie.set('fit_' + name, val, {expires: 60 * 60 * 24 * 365});
						window.Fit.utm[name] = val;
						window.Fit1CApi.Cookie.set('fit_referrer', document.referrer, {expires: 60 * 60 * 24 * 365});
						window.Fit1CApi.Cookie.set('fit_source', window.location.href, {expires: 60 * 60 * 24 * 365});
					}
				});
				if (!window.Fit1CApi.Cookie.get('fit_referrer')) window.Fit1CApi.Cookie.set('fit_referrer', document.referrer, {expires: 60 * 60 * 24 * 365});
				if (!window.Fit1CApi.Cookie.get('fit_source')) window.Fit1CApi.Cookie.set('fit_source', window.location.href, {expires: 60 * 60 * 24 * 365});

				window.Fit.utm['referrer'] = window.Fit1CApi.Cookie.get('fit_referrer');
				window.Fit.utm['source'] = window.Fit1CApi.Cookie.get('fit_source');

				if (language !== 'ru' && language !== 'ru-RU' && language !== 'ru-ru') language = 'en';
				language = language.substr(0, 2).toLowerCase();

				if (window.Fit1CApi.Cookie.get('Fit.lang')) window.Fit.lang_code = window.Fit1CApi.Cookie.get('Fit.lang');
				else window.Fit.lang_code = language;

				if (window.Fit.club_params.not_show_link_1C) window.hideLink = true;

				if ($(window.Fit.block.calendarContent).length) {
					// if (window.hideLink === undefined) window.hideLink = !$(window.Fit.block.calendarContent).find('a').length;

					$(window.Fit.block.calendarContent).html(window.Fit.block.loaderHTML);
					$.fit1CApi.getCalendar();
				}
				if ($(window.Fit.block.userCabinetIndex).length) {
					$.fit1CApi.isLK = window.Fit.is_lk = true;
					let params = [
						'lang=' + window.Fit.lang_code,
						'lang_cookie=' + lang_cookie,
						'salon_id=' + window.Fit.salon_id,
						'club_id=' + FitTools.getQueryString('club_id'),
						'host_type=' + window.Fit.host_type,
						'token=' + FitAuth.getUserToken()
					]

					window.Fit.getJs(dirLib + '/form/define.js?' + params.join('&'));
					window.Fit.getJs(dirLib + '/form/lk.js?' + params.join('&'), true, function () {
						$.fit1CApi.init();
					});
				} else $.fit1CApi.init();
			})(jQuery);
		}
	};
	window.Fit.club_id = window.Fit.salon_id = scriptFitApi.getAttribute('data-fit-salon-id');
	window.Fit.reloadPage = scriptFitApi.getAttribute('data-fit-reload-page');
	if (scriptFitApi.dataset.skipCustomStyle) window.Fit.skipCustomStyle = true;
	else window.Fit.skipCustomStyle = false;

// data-fit-reload-page=true -служит для перезагрузки страницы если нет тега #FIT_1C_SCHEDULE#
	window.Fit.loadFit = function () {
		let language = window.navigator ? (window.navigator.language || window.navigator.systemLanguage || window.navigator.userLanguage) : "en";
		if (language !== 'ru' && language !== 'ru-RU' && language !== 'ru-ru') language = 'en';

		language = language.substr(0, 2).toLowerCase();
		window.Fit.lang_code = language;
		if (document.body.innerHTML.match(/#FIT_1C_SCHEDULE#/i)) {
			let isBreak = false, elms = document.getElementsByTagName("*"), len = elms.length;
			for (let ii = 0; ii < len; ii++) {
				let myChildred = elms[ii].childNodes, len2;
				len2 = myChildred.length;
				for (let jj = 0; jj < len2; jj++) {
					if (myChildred[jj].nodeType === 3) {
						if (myChildred[jj].nodeValue.match(/#FIT_1C_SCHEDULE#/i)) {
							let divFit = document.createElement('div');
							divFit.setAttribute('data-fit1c-calendar', '');
							if (window.Fit.lang_code === 'en') {/*divFit.innerHTML = '<a href="https://www.fitness1c.ru/">powered by 1C\n</a>';*/
							} else divFit.innerHTML = 'Расписание работает на <a href="https://www.fitness1c.ru/">1С:Фитнес клуб</a>';

							elms[ii].childNodes[jj].remove();
							elms[ii].prepend(divFit);
							isBreak = true;
							break;
						}
					}
				}
				if (isBreak) break;
			}
		} else if (window.Fit.reloadPage === 'true') window.location.reload();


		if (typeof window.jQuery === 'undefined') window.Fit.getJs('https://ajax.googleapis.com/ajax/libs/jquery/3.5.0/jquery.min.js', false, window.Fit.loadCore);
		else window.Fit.loadCore();

		let contentBlock = document.querySelectorAll(window.Fit.block.userCabinetIndex);
		if (contentBlock.length) contentBlock[0].innerHTML = window.Fit.block.loaderHTML;
	};

	if (['complete', 'interactive'].indexOf(document.readyState) !== -1) window.Fit.loadFit();
	else document.addEventListener("DOMContentLoaded", window.Fit.loadFit);

} catch (e) {
	console.log(e);
}
