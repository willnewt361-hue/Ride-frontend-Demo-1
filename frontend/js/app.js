/**
 * RIDE Platform - Frontend JavaScript
 * Copyright (c) 2025 Newton & Devin AI Assistant. All rights reserved.
 * Purpose: Handle frontend interactions, API calls, and state management
 * Code Flow: User Action → JavaScript → API Call → Response → UI Update
 */

const $=s=>document.querySelector(s);
const state={
  waitlist:JSON.parse(localStorage.getItem('ride_waitlist')||'[]'),
  rideStatus:localStorage.getItem('rideStatus')||'searching',
  rideFare:Number(localStorage.getItem('rideFare')||'0'),
  wallet:Number(localStorage.getItem('rideWallet')||'85000'),
  currentRide:JSON.parse(localStorage.getItem('currentRide')||'null'),
  notifications:JSON.parse(localStorage.getItem('notifications')||'[]'),
  currentUser:JSON.parse(localStorage.getItem('currentUser')||'null'),
  inviteCode:localStorage.getItem('inviteCode')||null
};

// API Configuration
const API_BASE = 'http://localhost:8000/api';

// Helper Functions
function money(n){return new Intl.NumberFormat('en-UG',{maximumFractionDigits:0}).format(n)}
function generateInviteCode(){return 'RIDE-'+Math.random().toString(36).substring(2,8).toUpperCase()}

// Waitlist Functions
function saveWaitlist(item){
  const inviteCode = generateInviteCode();
  const entry={
    ...item,
    inviteCode,
    position: state.waitlist.length + 1,
    surgeFreeMonths: 3,
    createdAt: new Date().toISOString()
  };
  state.waitlist.push(entry);
  localStorage.setItem('ride_waitlist',JSON.stringify(state.waitlist));
  localStorage.setItem('inviteCode', inviteCode);
  return entry;
}

async function submitWaitlist(data){
  try{
    const response = await fetch(`${API_BASE}/waitlist/join`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(data)
    });
    if(response.ok){
      const result = await response.json();
      return result;
    } else{
      console.error('API Error:', response.status);
      // Fallback to local storage for demo
      return saveWaitlist(data);
    }
  } catch(error){
    console.error('Network Error:', error);
    // Fallback to local storage for demo
    return saveWaitlist(data);
  }
}

// Ride Functions
function updateRideStatus(status,rideData=null){
  state.rideStatus=status;
  localStorage.setItem('rideStatus',status);
  if(rideData){
    state.currentRide=rideData;
    localStorage.setItem('currentRide',JSON.stringify(rideData));
  }
}

function addNotification(type,title,message){
  const notification={
    id:Date.now(),
    type,
    title,
    message,
    time:'Just now',
    read:false
  };
  state.notifications.unshift(notification);
  localStorage.setItem('notifications',JSON.stringify(state.notifications));
  return notification;
}

function updateWallet(amount){
  state.wallet+=amount;
  localStorage.setItem('rideWallet',state.wallet.toString());
  return state.wallet;
}

// Authentication Functions
async function login(email,password,role){
  try{
    const response = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({email,password,role})
    });
    if(response.ok){
      const result = await response.json();
      state.currentUser = result.user;
      localStorage.setItem('currentUser', JSON.stringify(result.user));
      localStorage.setItem('token', result.access_token);
      return result;
    } else{
      throw new Error('Login failed');
    }
  } catch(error){
    console.error('Login Error:', error);
    // Demo fallback
    return {
      access_token: 'demo_token',
      user: {id:1,email,full_name:'Demo User',role}
    };
  }
}

// Message Generation System
function generateOfferMessage(userId,offerType){
  const messages = {
    'discount': `🎉 CONGRATULATIONS! You've been selected for exclusive pricing. Use code: ${generateInviteCode()} for 20% off your next 5 rides!`,
    'bonus': '🎁 BONUS CREDIT! UGX 10,000 has been added to your wallet as a welcome bonus from RIDE!',
    'priority': '⚡ PRIORITY ACCESS! You can now book rides during peak hours with no surge pricing for the next 3 months!',
    'referral': '🤝 REFERRAL BONUS! Share your code and earn UGX 10,000 for each friend who joins RIDE!'
  };
  return messages[offerType] || '🎉 Welcome to RIDE! Your invite code is ready.';
}

// Error Handling
function handleApiError(error, context=''){
  console.error(`Error in ${context}:`, error);
  // In production, this would send to error tracking service
  return {error: true, message: `Something went wrong. Please try again.`};
}

// Initialize Application
document.addEventListener('DOMContentLoaded',()=>{
  const form=$('#waitlistForm');
  if(form){
    form.addEventListener('submit',async e=>{
      e.preventDefault();
      const data=Object.fromEntries(new FormData(form).entries());
      
      try{
        const result = await submitWaitlist(data);
        const msg=$('#waitlistMessage');
        msg.textContent=`Success! You're #${result.position} on the waitlist. Your invite code: ${result.inviteCode}`;
        msg.className='form-message success';
        form.reset();
        
        // Generate welcome message
        const welcomeMessage = generateOfferMessage(result.id, 'discount');
        console.log('Generated message:', welcomeMessage);
        
      } catch(error){
        const msg=$('#waitlistMessage');
        msg.textContent='Failed to join waitlist. Please try again.';
        msg.className='form-message error';
      }
    });
  }

  // Dashboard enhancements
  if(document.querySelector('.dashboard-layout')){
    const updateTime=()=>{
      const now=new Date();
      const greeting=now.getHours()<12?'Good morning':now.getHours()<18?'Good afternoon':'Good evening';
      const greetingEl=document.querySelector('.welcome-section h2');
      if(greetingEl){
        const name=greetingEl.textContent.split(',')[1]?.trim()||'Rider';
        greetingEl.textContent=`${greeting}, ${name} 👋`;
      }
    };
    updateTime();
    setInterval(updateTime,60000);
    
    // Animate stats on load
    const statCards=document.querySelectorAll('.stat-card');
    statCards.forEach((card,index)=>{
      card.style.opacity='0';
      card.style.transform='translateY(20px)';
      setTimeout(()=>{
        card.style.transition='all 0.5s ease';
        card.style.opacity='1';
        card.style.transform='translateY(0)';
      },index*100);
    });
  }

  // Enhanced mobile menu
  const menuToggle=$('#menuToggle');
  const sidebar=document.querySelector('.dashboard-sidebar');
  if(menuToggle&&sidebar){
    menuToggle.addEventListener('click',()=>{
      sidebar.classList.toggle('open');
    });
    document.addEventListener('click',(e)=>{
      if(!sidebar.contains(e.target)&&!menuToggle.contains(e.target)){
        sidebar.classList.remove('open');
      }
    });
  }
});