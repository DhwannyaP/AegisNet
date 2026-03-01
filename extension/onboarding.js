document.addEventListener('DOMContentLoaded', () => {
  const termsCheck = document.getElementById('terms-check');
  const agreeBtn = document.getElementById('agree-btn');
  const onboardingState = document.getElementById('onboarding-state');
  const successState = document.getElementById('success-state');

  // I added a bulletproof fallback here: it automatically syncs the button state 5 times a second
  setInterval(() => {
    if (agreeBtn.textContent === 'Saving agreement...') return; // Don't override the loading state
    agreeBtn.disabled = !termsCheck.checked;
  }, 200);

  // Normal event listener for instantaneous updates

  termsCheck.addEventListener('change', () => {
    if (agreeBtn.textContent !== 'Saving agreement...') {
      agreeBtn.disabled = !termsCheck.checked;
    }
  });

  // Handle the user clicking the agreement button

  agreeBtn.addEventListener('click', async () => {
    if (!termsCheck.checked) return;

    agreeBtn.disabled = true;
    agreeBtn.textContent = 'Saving agreement...';

    try {
      // Tell the background service worker to store this acceptance

      await chrome.runtime.sendMessage({
        type: 'ACCEPT_TERMS',
        userId: null, // Will be filled if Supabase session exists later
      });

      // Then I activate the monitoring automatically

      await chrome.runtime.sendMessage({ type: 'SET_ACTIVE', value: true });

      // Finally I flip the UI to show the success screen

      onboardingState.style.display = 'none';
      successState.style.display = 'block';

    } catch (err) {
      agreeBtn.disabled = false;
      agreeBtn.textContent = '✓ Agree & Activate AegisNet AI';
      alert('Error saving agreement. Please try again.');
    }
  });

  // When the page loads, I check if they already accepted the terms previously

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
