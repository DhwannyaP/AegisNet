document.addEventListener('DOMContentLoaded', () => {
  const termsCheck = document.getElementById('terms-check');
  const agreeBtn = document.getElementById('agree-btn');
  const onboardingState = document.getElementById('onboarding-state');
  const successState = document.getElementById('success-state');

  // Bulletproof fallback: sync button state automatically 5 times a second
  setInterval(() => {
    if (agreeBtn.textContent === 'Saving agreement...') return; // Don't override loading state
    agreeBtn.disabled = !termsCheck.checked;
  }, 200);

  // Standard event listener
  termsCheck.addEventListener('change', () => {
    if (agreeBtn.textContent !== 'Saving agreement...') {
      agreeBtn.disabled = !termsCheck.checked;
    }
  });

  // Handle agreement
  agreeBtn.addEventListener('click', async () => {
    if (!termsCheck.checked) return;

    agreeBtn.disabled = true;
    agreeBtn.textContent = 'Saving agreement...';

    try {
      // Tell background to store acceptance
      await chrome.runtime.sendMessage({
        type: 'ACCEPT_TERMS',
        userId: null, // Will be filled if Supabase session exists later
      });

      // Activate monitoring automatically
      await chrome.runtime.sendMessage({ type: 'SET_ACTIVE', value: true });

      // Show success screen
      onboardingState.style.display = 'none';
      successState.style.display = 'block';

    } catch (err) {
      agreeBtn.disabled = false;
      agreeBtn.textContent = '✓ Agree & Activate AegisNet AI';
      alert('Error saving agreement. Please try again.');
    }
  });

  // Check if already accepted on load
  try {
    if (typeof chrome !== 'undefined' && chrome.runtime) {
      chrome.runtime.sendMessage({ type: 'GET_STATUS' }).then(status => {
        if (status && status.termsAccepted) {
          onboardingState.style.display = 'none';
          successState.style.display = 'block';
        }
      }).catch(e => console.log('Not in extension context'));
    }
  } catch (e) {
    console.log('Skipping status check - running locally');
  }
});
