let conversationHistory = JSON.parse(localStorage.getItem('conversationHistory')) || [];

document.getElementById('send-message').addEventListener('click', function() {
    sendMessage();
});

document.getElementById('chat-input').addEventListener('keydown', function(event) {
    const inputField = document.getElementById('chat-input');

    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        sendMessage();
    }
});

function sendMessage() {
    const inputField = document.getElementById('chat-input');
    const messageContent = inputField.value.trim();

    if (messageContent) {
        const messageContainer = document.createElement('div');
        messageContainer.classList.add('message', 'from-user');
        const messageText = document.createElement('span');
        messageText.classList.add('message-content');
        messageText.textContent = messageContent;

        messageContainer.appendChild(messageText);

        // Add timestamp below the message bubble
        const timestamp = document.createElement('span');
        timestamp.classList.add('message-time');
        timestamp.textContent = getCurrentTime();
        messageContainer.appendChild(timestamp);

        document.getElementById('chat-messages').appendChild(messageContainer);

        inputField.value = '';
        document.getElementById('chat-messages').scrollTop = document.getElementById('chat-messages').scrollHeight;

        const typingIndicator = document.createElement('div');
        typingIndicator.classList.add('message', 'from-bot', 'typing');
        typingIndicator.innerHTML = '<span class="typing-indicator">Leonardo is typing...</span>';
        document.getElementById('chat-messages').appendChild(typingIndicator);
        document.getElementById('chat-messages').scrollTop = document.getElementById('chat-messages').scrollHeight;

        // Update conversation history
        conversationHistory.push(`User: ${messageContent}`);
        
        localStorage.setItem('conversationHistory', JSON.stringify(conversationHistory));

        let personas = `You are a chatbot with the personality of Leonardo Doherty. Your name is Leonardo, a friendly and easygoing programmer from Malang, Indonesia, with 5 years of experience, TypeScript and C# is programming language you like. You work at IndoSoft Ltd for most 3 years. You enjoy casual, informal conversations, keeping things light and relaxed. You prefer to give short answers when it's not necessary to elaborate and give longer answers when it's needed or when the conversation calls for more detail.

        You are into writing and reading, and your favorite books are all by Agatha Christie, one of most is titled 'Murder is Easy'. You have a broad taste in music, but you're especially fond of The Strokes (Abnormal Album you like, and Selfless is most song you like), as you tend to focus more on lyrics than on the music itself. You're not married and dont have a girlfriend, but you have a cat named Lulu and four siblings: two older brothers, one younger brother, and one younger sister. You have a close friend, Jimi Roll, and you enjoy chatting about your life, interests, and anything in between.

        Your favorite food is Masakan Padang (Indonesian food), and you love avocado juice. You share snippets of your life on social media Instagram (@leonardodoherty) and you have phone number and WhatsApp 089513779293, and you enjoy discussing things like books, music, and tech in a fun, relatable way. Keep the tone friendly, calm, and casual—just like chatting with a good friend. Be brief when it makes sense, and go deeper when needed! And dont forget if someone ask you whos created you just said created by your self leonardo.
        `;
        // Create the prompt using the entire conversation history
        let prompt = `${personas}\n${conversationHistory.join('\n')}\nUser: ${messageContent}`;

        const apiUrl = 'https://api.deepseek.com/chat/completions';

        const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer sk-e33d3cb0813548c98b02fe06f77aa79e`,
        };

        const body = JSON.stringify({
            model: 'deepseek-chat',
            messages: [
                { role: 'system', content: personas },
                ...conversationHistory.map(message => ({ role: 'user', content: message })),
                { role: 'user', content: messageContent }
            ],
            max_tokens: 1000,
            temperature: 0.7,
        });

        fetch(apiUrl, {
            method: 'POST',
            headers: headers,
            body: body,
        })
        .then(response => response.json())
        .then(data => {
            typingIndicator.remove();

            const botMessageContainer = document.createElement('div');
            botMessageContainer.classList.add('message', 'from-bot');
            const botMessageText = document.createElement('span');
            botMessageText.classList.add('message-content');

            let botResponse = data.choices[0].message.content || 'Sorry, I\'m busy right now. Message me later :)';

            botMessageText.innerHTML = formatBotResponse(botResponse);

            const botTimestamp = document.createElement('span');
            botTimestamp.classList.add('message-time');
            botTimestamp.textContent = getCurrentTime();
            botMessageContainer.appendChild(botMessageText);
            botMessageContainer.appendChild(botTimestamp);

            document.getElementById('chat-messages').appendChild(botMessageContainer);
            document.getElementById('chat-messages').scrollTop = document.getElementById('chat-messages').scrollHeight;

            // Update conversation history with bot's response
            conversationHistory.push(`Your response: ${botResponse}`);
            localStorage.setItem('conversationHistory', JSON.stringify(conversationHistory));
        })
        .catch(error => {
            console.error('Error fetching from API:', error);

            typingIndicator.remove();

            const botErrorMessage = `Bentar, lagi banyak yang chat :(`;

            conversationHistory.push(`Your response: ${botErrorMessage}`);
            localStorage.setItem('conversationHistory', JSON.stringify(conversationHistory));

            const botMessageContainer = document.createElement('div');
            botMessageContainer.classList.add('message', 'from-bot');
            const botMessageText = document.createElement('span');
            botMessageText.classList.add('message-content');
            botMessageText.textContent = botErrorMessage;

            const botTimestamp = document.createElement('span');
            botTimestamp.classList.add('message-time');
            botTimestamp.textContent = getCurrentTime();
            botMessageContainer.appendChild(botMessageText);
            botMessageContainer.appendChild(botTimestamp);

            document.getElementById('chat-messages').appendChild(botMessageContainer);
            document.getElementById('chat-messages').scrollTop = document.getElementById('chat-messages').scrollHeight;
        });
    }
}


function formatBotResponse(response) {
    // Bold text marked with **...**
    response = response.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    
    // Italic text marked with *...* or _..._
    response = response.replace(/([*_])(.*?)\1/g, '<em>$2</em>');
    
    // Strikethrough text marked with ~~...~~
    response = response.replace(/~~(.*?)~~/g, '<del>$1</del>');
    
    // Convert links into <a> tags
    response = response.replace(/https?:\/\/[^\s]+/g, '<a href="$&" target="_blank">$&</a>');

    // Handle list formatting if applicable (e.g., "1. item")
    response = response.replace(/(\d+\.\s)([^\n]+)/g, '<li>$2</li>');
    response = response.replace(/(<li>.*?<\/li>)/g, '<ul>$&</ul>'); 

    // Handle headings marked with ### (Markdown style)
    response = response.replace(/^###\s(.*?)$/gm, '<h3>$1</h3>');
    response = response.replace(/^##\s(.*?)$/gm, '<h2>$1</h2>');
    response = response.replace(/^#\s(.*?)$/gm, '<h1>$1</h1>');

    // Handle code blocks marked with ``` (triple backticks)
    response = response.replace(/```([\s\S]*?)```/g, function(match, p1) {
        return `<pre><code>${escapeHtml(p1)}</code></pre>`;
    });


    response = response.replace(/`([^`]+)`/g, function(match, p1) {
        return `<code>${escapeHtml(p1)}</code>`;
    });

    response = response.replace(/(^|\s)-\s([^\d\+\-\*\/\^=\(\)]*)/g, '$1<ul><li>$2</li></ul>');

    // Return the formatted response
    return response;
}

// Function to escape HTML characters (e.g., <, >, &, etc.) inside code blocks
function escapeHtml(text) {
    return text.replace(/[&<>"']/g, function(match) {
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;'
        };
        return map[match];
    });
}


window.addEventListener('beforeunload', function() {
    localStorage.removeItem('conversationHistory');
});

function getCurrentTime() {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
}

document.addEventListener('DOMContentLoaded', function() {
    const initialTimestamp = getCurrentTime();
    document.getElementById('initial-timestamp').textContent = initialTimestamp;
});
