// Global variables
let loginArea, signupArea, chatArea, messagesDiv, messageInput, db, rtdb;
let currentUser = null;
let currentOpenMenu = null;

function showError(message, containerId) {
    const errorContainer = document.getElementById(containerId);
    if (errorContainer) {
        errorContainer.textContent = message;
        errorContainer.style.display = 'block';
        setTimeout(() => {
            errorContainer.style.display = 'none';
        }, 3000);
    }
}

document.addEventListener("DOMContentLoaded", function() {
    // Firebase configuration
    const firebaseConfig = {
        apiKey: "AIzaSyC-x3ugd_Bf2kzuKTblZJC3qCbB5T_NY2w",
        authDomain: "project-2957922020824939495.firebaseapp.com",
        projectId: "project-2957922020824939495",
        databaseURL: "https://project-2957922020824939495-default-rtdb.asia-southeast1.firebasedatabase.app",
        storageBucket: "project-2957922020824939495.appspot.com",
        messagingSenderId: "968070742990",
        appId: "1:968070742990:web:417b4f167f1038aa3ee19f",
        measurementId: "G-PPNWVETRJ8"
    };

    // Initialize Firebase
    firebase.initializeApp(firebaseConfig);

    // Initialize Firestore
    db = firebase.firestore();

    // Initialize Realtime Database
    rtdb = firebase.database();

    // DOM elements
    loginArea = document.getElementById('loginArea');
    signupArea = document.getElementById('signupArea');
    chatArea = document.getElementById('chatArea');
    messagesDiv = document.getElementById('messages');
    messageInput = document.getElementById('messageInput');

    // Event listeners
    messageInput?.addEventListener('keypress', function(event) {
        if (event.key === 'Enter') {
            sendMessage();
        }
    });

    // Authentication state observer
    firebase.auth().onAuthStateChanged((user) => {
        if (user) {
            currentUser = user;
            showChatArea();
            loadMessages();
        } else {
            currentUser = null;
            showLoginForm();
        }
    });
});

// Authentication functions
window.login = function() {
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    firebase.auth().signInWithEmailAndPassword(email, password)
        .then((userCredential) => {
            localStorage.setItem('email', email);
            showChatArea();
        })
        .catch((error) => {
            showError(error.message, 'loginError');
        });
};

window.signup = function() {
    const username = document.getElementById('signupUsername').value;
    const email = document.getElementById('signupEmail').value;
    const password = document.getElementById('signupPassword').value;

    if (!validateUsername(username)) {
        showError("اسم المستخدم يجب أن يكون بين 3 إلى 30 حرفًا وبالأحرف الإنجليزية فقط.", 'signupError');
        return;
    }

    if (!validatePassword(password)) {
        showError("كلمة المرور يجب أن تكون 8 أحرف على الأقل.", 'signupError');
        return;
    }

    firebase.auth().createUserWithEmailAndPassword(email, password)
        .then((userCredential) => {
            return db.collection('users').doc(userCredential.user.uid).set({
                username: username,
                email: email
            });
        })
        .then(() => {
            localStorage.setItem('email', email);
            showChatArea();
        })
        .catch((error) => {
            showError(error.message, 'signupError');
        });
};

window.logout = function() {
    firebase.auth().signOut().then(() => {
        localStorage.removeItem('email');
        showLoginForm();
    }).catch((error) => {
        console.error("خطأ في تسجيل الخروج:", error);
    });
};

// UI functions
window.showLoginForm = function() {
    if (loginArea) loginArea.style.display = 'block';
    if (signupArea) signupArea.style.display = 'none';
    if (chatArea) chatArea.style.display = 'none';
}

window.showSignupForm = function() {
    if (loginArea) loginArea.style.display = 'none';
    if (signupArea) signupArea.style.display = 'block';
    if (chatArea) chatArea.style.display = 'none';
}

window.showChatArea = function() {
    if (loginArea) loginArea.style.display = 'none';
    if (signupArea) signupArea.style.display = 'none';
    if (chatArea) chatArea.style.display = 'block';
    loadMessages();
}

// Message handling functions
function loadMessages() {
    if (!messagesDiv) return;
    
    const messagesRef = rtdb.ref('messages');
    
    messagesRef.on('child_added', (snapshot) => {
        const message = snapshot.val();
        const messageId = snapshot.key;
        displayMessage(message, messageId);
    });

    messagesRef.on('child_changed', (snapshot) => {
        const message = snapshot.val();
        const messageId = snapshot.key;
        const messageElement = document.querySelector(`.message[data-message-id="${messageId}"]`);
        if (messageElement) {
            messageElement.querySelector('.text').textContent = message.text;
        }
    });

    messagesRef.on('child_removed', (snapshot) => {
        const messageId = snapshot.key;
        const messageElement = document.querySelector(`.message[data-message-id="${messageId}"]`);
        if (messageElement) {
            messageElement.remove();
        }
    });
}

window.sendMessage = function() {
    if (!messageInput || !currentUser) return;

    const messageText = messageInput.value.trim();
    if (messageText === '') return;

    const message = {
        user: currentUser.email,
        text: messageText,
        timestamp: firebase.database.ServerValue.TIMESTAMP
    };

    rtdb.ref('messages').push(message)
        .then(() => {
            messageInput.value = '';
        })
        .catch((error) => {
            console.error("Error sending message: ", error);
            showError("حدث خطأ في إرسال الرسالة", 'chatError');
        });
};

// تحديث الكود السابق مع إضافة متغيرات جديدة
let isEditing = false;
let editingMessageId = null;
let lastDate = null;

// تعديل وظيفة عرض الرسائل
function displayMessage(message, messageId) {
    if (!messagesDiv || !message) return;

    const timestamp = new Date(message.timestamp);
    const messageDate = timestamp.toLocaleDateString('ar-EG-u-nu-latn', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'long'
    });
    
    
    
    // التحقق من تغيير التاريخ وإضافة فاصل التاريخ
    if (lastDate !== messageDate) {
        const dateDiv = document.createElement('div');
        dateDiv.className = 'date-separator';
        dateDiv.textContent = messageDate;
        messagesDiv.appendChild(dateDiv);
        lastDate = messageDate;
    }

    const messageElement = document.createElement('div');
    messageElement.classList.add('message');
    messageElement.dataset.messageId = messageId;
    
    // إضافة صف مختلف للرسائل المرسلة من المستخدم الحالي
    if (currentUser && message.user === currentUser.email) {
        messageElement.classList.add('my-message');
    }
    
    const timeStr = timestamp.toLocaleTimeString('ar-EG', {
        hour: '2-digit',
        minute: '2-digit'
    });

    const isLastMessage = messagesDiv.lastElementChild === null || 
                         messageId === messagesDiv.lastElementChild.dataset.messageId;

    messageElement.innerHTML = `
        <div class="message-content">
            <span class="user">${message.user}</span>
            <span class="text">${message.text}</span>
            <span class="timestamp" style="display: ${isLastMessage ? 'block' : 'none'}">${timeStr}</span>
        </div>
        ${currentUser && message.user === currentUser.email ? `
        <div class="message-menu">
            <button class="menu-toggle">⋮</button>
            <div class="message-options" style="display: none;">
                <button class="edit-option">تعديل</button>
                <button class="delete-option">حذف</button>
                <button class="copy-option">نسخ</button>
            </div>
        </div>
        ` : ''}
    `;

    messagesDiv.appendChild(messageElement);

    // إضافة مستمعات الأحداث
    messageElement.addEventListener('click', () => {
        const timestamp = messageElement.querySelector('.timestamp');
        if (timestamp) {
            const allTimestamps = document.querySelectorAll('.timestamp');
            allTimestamps.forEach(ts => {
                if (ts !== timestamp && !ts.closest('.message').isLastMessage) {
                    ts.style.display = 'none';
                }
            });
            timestamp.style.display = timestamp.style.display === 'none' ? 'block' : 'none';
        }
    });

    const menuToggle = messageElement.querySelector('.menu-toggle');
    const messageOptions = messageElement.querySelector('.message-options');

    if (menuToggle && messageOptions) {
        menuToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleMenu(messageOptions);
        });

        const editButton = messageElement.querySelector('.edit-option');
        if (editButton) {
            editButton.addEventListener('click', () => startEditing(messageId, message.text));
        }

        const deleteButton = messageElement.querySelector('.delete-option');
        if (deleteButton) {
            deleteButton.addEventListener('click', () => deleteMessage(messageId));
        }

        const copyButton = messageElement.querySelector('.copy-option');
        if (copyButton) {
            copyButton.addEventListener('click', () => copyMessageText(message.text));
        }
    }

    scrollToBottom();
}

// تعديل وظيفة إرسال الرسائل لمنع الإرسال المزدوج
window.sendMessage = function() {
    if (!messageInput || !currentUser || isEditing) return;

    const messageText = messageInput.value.trim();
    if (messageText === '') return;

    // تعطيل حقل الإدخال مؤقتاً لمنع الإرسال المزدوج
    messageInput.disabled = true;

    const message = {
        user: currentUser.email,
        text: messageText,
        timestamp: firebase.database.ServerValue.TIMESTAMP
    };

    rtdb.ref('messages').push(message)
        .then(() => {
            messageInput.value = '';
        })
        .catch((error) => {
            console.error("Error sending message: ", error);
            showError("حدث خطأ في إرسال الرسالة", 'chatError');
        })
        .finally(() => {
            messageInput.disabled = false;
            messageInput.focus();
        });
};

// وظيفة جديدة لبدء التعديل
function startEditing(messageId, currentText) {
    if (isEditing) return;

    isEditing = true;
    editingMessageId = messageId;

    const messageElement = document.querySelector(`.message[data-message-id="${messageId}"]`);
    if (!messageElement) return;

    const textSpan = messageElement.querySelector('.text');
    const originalText = textSpan.textContent;

    // إنشاء حقل التعديل
    const editInput = document.createElement('input');
    editInput.type = 'text';
    editInput.className = 'edit-input';
    editInput.value = originalText;

    // استبدال النص بحقل التعديل
    textSpan.style.display = 'none';
    textSpan.parentNode.insertBefore(editInput, textSpan);

    // تحديث أزرار القائمة
    const menuOptions = messageElement.querySelector('.message-options');
    if (menuOptions) {
        menuOptions.innerHTML = `
            <button class="save-edit">✓</button>
            <button class="cancel-edit">✗</button>
        `;

        // إضافة مستمعات الأحداث للأزرار الجديدة
        const saveButton = menuOptions.querySelector('.save-edit');
        const cancelButton = menuOptions.querySelector('.cancel-edit');

        saveButton.addEventListener('click', () => saveEdit(messageId, editInput.value, textSpan));
        cancelButton.addEventListener('click', () => cancelEdit(textSpan, editInput));
    }

    editInput.focus();
    editInput.select();

    // معالجة مفتاح Enter للحفظ وEscape للإلغاء
    editInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            saveEdit(messageId, editInput.value, textSpan);
        } else if (e.key === 'Escape') {
            cancelEdit(textSpan, editInput);
        }
    });
}

// وظيفة حفظ التعديل
function saveEdit(messageId, newText, textSpan) {
    if (!newText.trim()) return;

    rtdb.ref('messages').child(messageId).update({ text: newText.trim() })
        .then(() => {
            endEditing(textSpan);
        })
        .catch((error) => {
            console.error('Error updating message:', error);
            showError("حدث خطأ في تحديث الرسالة", 'chatError');
        });
}

// وظيفة إلغاء التعديل
function cancelEdit(textSpan, editInput) {
    endEditing(textSpan);
    if (editInput && editInput.parentNode) {
        editInput.parentNode.removeChild(editInput);
    }
}

// وظيفة إنهاء وضع التعديل
function endEditing(textSpan) {
    isEditing = false;
    editingMessageId = null;
    
    if (textSpan) {
        textSpan.style.display = '';
    }

    // إعادة تهيئة القائمة
    const messageElement = textSpan.closest('.message');
    if (messageElement) {
        const editInput = messageElement.querySelector('.edit-input');
        if (editInput) {
            editInput.parentNode.removeChild(editInput);
        }

        const menuOptions = messageElement.querySelector('.message-options');
        if (menuOptions) {
            menuOptions.innerHTML = `
                <button class="edit-option">تعديل</button>
                <button class="delete-option">حذف</button>
                <button class="copy-option">نسخ</button>
            `;
        }
    }
}
function toggleMenu(menuElement) {
    if (!menuElement) return;

    if (currentOpenMenu && currentOpenMenu !== menuElement) {
        currentOpenMenu.style.display = 'none';
    }
    menuElement.style.display = menuElement.style.display === 'none' ? 'block' : 'none';
    currentOpenMenu = menuElement.style.display === 'block' ? menuElement : null;
}

function deleteMessage(messageId) {
    rtdb.ref('messages').child(messageId).remove()
        .catch((error) => {
            console.error('Error deleting message:', error);
            showError("حدث خطأ في حذف الرسالة", 'chatError');
        });
}

function copyMessageText(text) {
    navigator.clipboard.writeText(text)
        .then(() => {
            const copyStatus = document.getElementById('copyStatus');
            if (copyStatus) {
                copyStatus.textContent = "تم نسخ الرسالة";
                copyStatus.style.display = 'block';
                setTimeout(() => {
                    copyStatus.style.display = 'none';
                }, 2000);
            }
        })
        .catch(err => {
            console.error('Error copying text: ', err);
            showError("حدث خطأ في نسخ الرسالة", 'chatError');
        });
}

// Helper functions
function validateUsername(username) {
    const usernameRegex = /^[a-zA-Z]{3,30}$/;
    return usernameRegex.test(username);
}

function validatePassword(password) {
    return password.length >= 8;
}

function formatDate(date) {
    const options = { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit' 
    };
    return date.toLocaleString('ar-EG', options);
}

function scrollToBottom() {
    if (messagesDiv) {
        messagesDiv.scrollTop = messagesDiv.scrollHeight;
    }
}

// Close menus when clicking outside
document.addEventListener('click', () => {
    if (currentOpenMenu) {
        currentOpenMenu.style.display = 'none';
        currentOpenMenu = null;
    }
});