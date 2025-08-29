const ul = document.querySelector( "ul" )
const textarea = document.querySelector( "textarea" )

textarea.onkeyup = e => {

	if ( e.key === "Enter" ) {

		fetch( "http://localhost:3000/prompt", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify( { prompt: textarea.value } ),
		} )
		.then( response => response.text() )
		.then( text => {

			const li = document.createElement( "LI" )
			li.textContent = text
			ul.appendChild( li )
			textarea.value = null
		} )
	}
}
