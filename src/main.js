const messagesContainer = document.getElementById('messages')
const messageInput = document.getElementById('messageInput')
const sendButton = document.getElementById('sendButton')
const themeToggle = document.getElementById('themeToggle')

let isLoading = false

function initTheme() {
	const savedTheme = localStorage.getItem('theme') || 'light'
	document.documentElement.setAttribute('data-theme', savedTheme)
	updateThemeIcon(savedTheme)
}

function updateThemeIcon(theme) {
	const icon = themeToggle.querySelector('i')
	if (theme === 'dark') {
		icon.className = 'fas fa-moon'
	} else {
		icon.className = 'fas fa-sun'
	}
}

function toggleTheme() {
	const currentTheme = document.documentElement.getAttribute('data-theme')
	const newTheme = currentTheme === 'dark' ? 'light' : 'dark'
	
	document.documentElement.setAttribute('data-theme', newTheme)
	localStorage.setItem('theme', newTheme)
	updateThemeIcon(newTheme)
}

function autoResizeTextarea() {
	messageInput.style.height = 'auto'
	messageInput.style.height = Math.min(messageInput.scrollHeight, 96) + 'px'
}

function addMessage(content, type = 'ai') {
	const messageDiv = document.createElement('div')
	messageDiv.className = `message ${type}`
	
	const span = document.createElement('span')
	span.textContent = content
	messageDiv.appendChild(span)
	
	messagesContainer.appendChild(messageDiv)
	messagesContainer.scrollTop = messagesContainer.scrollHeight
}

function showLoading() {
	const loadingDiv = document.createElement('div')
	loadingDiv.className = 'message ai loading'
	loadingDiv.id = 'loading-message'
	
	loadingDiv.innerHTML = `
		<div class="spinner"></div>
		<span>Javob tayyorlanmoqda...</span>
	`
	
	messagesContainer.appendChild(loadingDiv)
	messagesContainer.scrollTop = messagesContainer.scrollHeight
}

function hideLoading() {
	const loadingMessage = document.getElementById('loading-message')
	if (loadingMessage) {
		loadingMessage.remove()
	}
}

function updateSendButton() {
	const hasText = messageInput.value.trim().length > 0
	sendButton.disabled = isLoading || !hasText
	
	if (isLoading) {
		sendButton.innerHTML = '<div class="spinner" style="width: 1rem; height: 1rem; border-width: 2px;"></div>'
	} else {
		sendButton.innerHTML = '<i class="fas fa-paper-plane"></i>'
	}
}

async function sendMessage() {
	const message = messageInput.value.trim()
	if (!message || isLoading) return
	
	isLoading = true
	updateSendButton()
	
	addMessage(message, 'user')
	messageInput.value = ''
	autoResizeTextarea()
	
	showLoading()
	
	try {
		const response = await fetch("http://localhost:3000/prompt", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({ prompt: message }),
		})
		
		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`)
		}
		
		const text = await response.text()
		hideLoading()
		addMessage(text, 'ai')
		
	} catch (error) {
		hideLoading()
		addMessage('Xatolik yuz berdi. Iltimos qaytadan urinib ko\'ring.', 'ai')
		console.error('Error:', error)
	} finally {
		isLoading = false
		updateSendButton()
		messageInput.focus()
	}
}

themeToggle.addEventListener('click', toggleTheme)
sendButton.addEventListener('click', sendMessage)

messageInput.addEventListener('input', () => {
	autoResizeTextarea()
	updateSendButton()
})

messageInput.addEventListener('keydown', (e) => {
	if (e.key === 'Enter' && !e.shiftKey) {
		e.preventDefault()
		sendMessage()
	}
})

messageInput.addEventListener('paste', () => {
	setTimeout(autoResizeTextarea, 0)
})

initTheme()
updateSendButton()
messageInput.focus()
