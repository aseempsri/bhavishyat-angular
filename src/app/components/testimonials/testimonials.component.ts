import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

interface ChatMessage {
  text: string;
  time: string;
  from: 'client' | 'shubhram';
}

interface ChatThread {
  label: string;
  messages: ChatMessage[];
}

@Component({
  selector: 'app-testimonials',
  imports: [CommonModule],
  templateUrl: './testimonials.component.html',
  styleUrl: './testimonials.component.css'
})
export class TestimonialsComponent {
  readonly threads: ChatThread[] = [
    {
      label: 'Career consultation',
      messages: [
        {
          from: 'client',
          text: 'Hi Shubhram, wanted to drop a quick message. My consultation with you has been so unique compared to other astro consultations I\'ve had.',
          time: '9:33 AM'
        },
        {
          from: 'client',
          text: 'You were extremely detail-oriented and pointed out things about my personality that literally no one has ever told me before.',
          time: '9:34 AM'
        },
        {
          from: 'client',
          text: 'Also, thank you again for the guidance on that very important career decision. Really helped me clear the fog! 🙏',
          time: '9:35 AM'
        },
        {
          from: 'shubhram',
          text: 'Thanks a lot! Sahi raste pe chalte raho, career mein aage aur achhi growth milegi. Koi bhi help chahiye ho toh feel free to reach out anytime! 👍',
          time: '5:28 PM'
        }
      ]
    },
    {
      label: 'Varshfal guidance',
      messages: [
        {
          from: 'client',
          text: 'Amazing consultation today, Shubhram. Honestly, I\'m a bit speechless!',
          time: '10:15 AM'
        },
        {
          from: 'client',
          text: 'Also, I\'ve been following the varshfal you sent, and the timing of various decisions seems to be working out perfectly. Never thought of astrology quite like this—it\'s very similar to the planning cycles we follow in our corporate jobs.',
          time: '10:17 AM'
        },
        {
          from: 'client',
          text: 'Thank you again for the deep dive!',
          time: '10:18 AM'
        },
        {
          from: 'shubhram',
          text: 'Thank you so much! Corporate planning wali analogy bilkul fit baithti hai yahan. Sahi timing aur right execution hi sabse bada game hai. Keep it up! 📈',
          time: '11:02 PM'
        }
      ]
    },
    {
      label: 'Personal consultation',
      messages: [
        {
          from: 'client',
          text: 'Jab maine unko bataye aapke reasons 2-3 cheezon ke jo aapne explain kiye, woh bhi dang reh gayi kyunki unke liye bhi yeh sab ek new revelation tha!',
          time: '4:42 PM'
        },
        {
          from: 'shubhram',
          text: 'Arre thank you so much! Bas purane concepts ko thoda practical angle se dekhte hain hum. Mummy ko mera pranam bolna! 🙌',
          time: '5:10 PM'
        }
      ]
    },
    {
      label: 'Life planning member',
      messages: [
        {
          from: 'client',
          text: 'Ab samajh mein aaya ki timing ka kya mahatva hota hai aur efforts ko kaise channelize kiya jaa sakta hai as per the varshfal.',
          time: '12:22 PM'
        },
        {
          from: 'client',
          text: 'Keep up the good work! 🥂',
          time: '12:28 PM'
        },
        {
          from: 'shubhram',
          text: 'Bahut-bahut badhai ho property ke liye bhai! Mehnat sirf tumhari hi thi, bas thoda sa sahi window ka wait karna tha. God bless! 🏡',
          time: '1:05 PM'
        }
      ]
    }
  ];
}
