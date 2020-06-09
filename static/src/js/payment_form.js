document.getElementById('pay_now').addEventListener('click',  function (event) {
	$.post('/payment', {order_id: document.getElementsByName('order_id')[0].value}, function (result) {
		data_dict = JSON.parse(result);
		form = document.createElement('form');
		form.setAttribute('action', data_dict['redirection_url']);
		console.log(form)
		delete data_dict['redirection_url'];
		for(const key in data_dict){
			new_element = document.createElement('input');
			new_element.setAttribute('name', key)
			new_element.setAttribute('value', data_dict[key])
			form.append(new_element)
		}
		document.getElementsByTagName('body')[0].append(form);
		form.submit()
	})
})