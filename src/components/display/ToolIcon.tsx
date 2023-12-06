import { Avatar, Card } from 'antd';

export const tools = [{
  name: 'Sketch.io',
  url: 'https://sketch.io/sketchpad/',
  icon: <img style={{ height: 'auto' }} src="https://sketch.io/media/Sketch_S.svg" alt="sketch.io" />,
  description: 'Sketchpad is an online drawing application -- written in canvas',
  toolType: 'Creation',
  createdBy: 'sketch.io',
  communityBuilt: true
},
// {
//   name: 'Email',
//   url: 'https://bitbadges-email-distribution-tool-trevormil.vercel.app/',
//   icon: <MailOutlined />,
//   description: 'Distribute claim codes via email.',
//   distributionMethod: DistributionMethod.Codes,
//   createdBy: 'BitBadges',
//   toolType: 'Distribution',
//   communityBuilt: true
// }, 
{
  name: 'Excalidraw',
  url: 'https://excalidraw.com/',
  icon: <img style={{ height: 'auto' }} src="https://avatars.githubusercontent.com/u/59452120" alt="Excalidraw" />,
  description: 'Virtual whiteboard for sketching hand-drawn like diagrams.',
  createdBy: 'Excalidraw',
  toolType: 'Creation',
  communityBuilt: true
},
{
  name: 'QR Codes',
  url: 'https://docs.bitbadges.io/',
  icon: <img style={{ height: 'auto' }} src="https://www.qrstuff.com/images/default_qrcode.png" alt="QR Codes" />,
  description: 'Generate QR codes for badge claims natively via the BitBadges app.',
  createdBy: 'BitBadges',
  toolType: 'Distribution',
  communityBuilt: true,
  native: true
},
{
  name: 'Whitelists',
  url: 'https://docs.bitbadges.io/',
  icon: <img style={{ height: 'auto' }} src="https://cdn1.iconfinder.com/data/icons/cybersecurity-1/512/Whitelisting-512.png" alt="Whitelists" />,
  description: 'Whitelist users to claim badges natively via the BitBadges app.',
  createdBy: 'BitBadges',
  toolType: 'Distribution',
  communityBuilt: true,
  native: true
},
{
  name: 'Passwords / Codes',
  url: 'https://docs.bitbadges.io/',
  icon: <img style={{ height: 'auto' }} src="https://png.pngtree.com/png-vector/20190508/ourmid/pngtree-vector-lock-icon-png-image_1028350.jpg" alt="Passwords" />,
  description: 'Restrict badge claims to users with a password or unique code.',
  createdBy: 'BitBadges',
  toolType: 'Distribution',
  communityBuilt: true,
  native: true
},
{
  name: 'Direct Message',
  url: 'https://docs.bitbadges.io/',
  icon: <img style={{ height: 'auto' }} src="https://cdn.icon-icons.com/icons2/3065/PNG/512/send_contact_dm_icon_190941.png" alt="DM Icon"></img>,
  description: 'Use your favorite social media site to distribute codes or alert users that they can claim your badge!',
  createdBy: 'BitBadges',
  toolType: 'Distribution',
  communityBuilt: true
},

{
  name: 'Blockin',
  url: 'https://blockin-quickstart.vercel.app/',
  icon: <img style={{ height: 'auto' }} src="https://bafybeibepriagbzr64w6ouvbctaxtixryf5trcubowgz7eihvs5b3dqh6y.ipfs.dweb.link/" alt="Blockin" />,
  // icon: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 109.06 122.88"><path fill='#1890ff' d="M34.43 47.86L52.8 37.6V18.31a9.233 9.233 0 01-5.46-3.16L17.91 32.18c.35.98.54 2.03.54 3.13 0 .92-.13 1.8-.38 2.64l16.36 9.91zm11.35-35.38a9.231 9.231 0 01-.59-3.25c0-2.55 1.03-4.86 2.7-6.53S51.87 0 54.42 0c2.55 0 4.86 1.03 6.53 2.7a9.205 9.205 0 012.7 6.53c0 1.12-.2 2.19-.56 3.18l29.57 17.1c.21-.25.42-.5.65-.73a9.205 9.205 0 016.53-2.7c2.55 0 4.86 1.03 6.53 2.7a9.205 9.205 0 012.7 6.53c0 2.55-1.03 4.85-2.7 6.52a9.194 9.194 0 01-5.32 2.62v33.91c2.07.27 3.92 1.22 5.32 2.62 1.67 1.67 2.7 3.98 2.7 6.52a9.222 9.222 0 01-9.23 9.23 9.205 9.205 0 01-7.15-3.39l-29.61 17.12c.36.99.56 2.06.56 3.18 0 2.55-1.03 4.86-2.7 6.53a9.205 9.205 0 01-6.53 2.7c-2.55 0-4.86-1.03-6.53-2.7s-2.7-3.98-2.7-6.53c0-1.14.21-2.24.59-3.25L16.35 93.38a9.205 9.205 0 01-7.13 3.36c-2.55 0-4.86-1.03-6.53-2.7C1.03 92.37 0 90.06 0 87.51s1.03-4.85 2.7-6.52a9.242 9.242 0 015.25-2.62V44.44a9.18 9.18 0 01-5.25-2.62A9.164 9.164 0 010 35.3c0-2.55 1.03-4.86 2.7-6.53a9.205 9.205 0 016.53-2.7 9.205 9.205 0 017.16 3.4l29.39-16.99zm15.76 2.61a9.192 9.192 0 01-5.55 3.23V37.6l18.33 10.62 16.85-9.74c-.37-.99-.56-2.07-.56-3.18 0-1.08.19-2.13.53-3.09l-29.6-17.12zm36.69 29.3a9.159 9.159 0 01-4.92-2.56c-.19-.19-.37-.38-.54-.59l-16.82 9.72v20.78l16.89 9.75c.15-.17.3-.34.46-.5a9.194 9.194 0 014.92-2.56V44.39h.01zm-7.07 46.27c-.36-.98-.55-2.04-.55-3.14 0-1.16.21-2.27.61-3.3l-16.34-9.43-18.89 10.98v18.79a9.192 9.192 0 015.55 3.23l29.62-17.13zm-43.82 17.06a9.233 9.233 0 015.46-3.16V85.68l-18.96-11-16.09 9.29c.45 1.09.71 2.29.71 3.55 0 1.12-.2 2.19-.56 3.18l29.44 17.02zM10.76 78.41c1.93.32 3.66 1.25 4.99 2.58.1.1.19.2.28.3l16.39-9.46V50.36L16.64 40.8c-.27.37-.57.71-.89 1.03a9.255 9.255 0 01-4.99 2.58v34zM9.24 41.34c.04 0 .08-.01.12-.01h.08a6 6 0 004.06-1.76 6.023 6.023 0 001.77-4.27c0-1.67-.68-3.18-1.77-4.27-1.09-1.09-2.6-1.77-4.27-1.77s-3.18.68-4.27 1.77a6.023 6.023 0 00-1.77 4.27c0 1.67.68 3.18 1.77 4.27a6.03 6.03 0 004.28 1.77zm49.44 68.05a6.023 6.023 0 00-4.27-1.77c-1.67 0-3.18.68-4.27 1.77-1.09 1.09-1.77 2.6-1.77 4.27s.68 3.18 1.77 4.27 2.6 1.77 4.27 1.77c1.67 0 3.18-.68 4.27-1.77 1.09-1.09 1.77-2.6 1.77-4.27s-.67-3.18-1.77-4.27zm0-104.43a6.023 6.023 0 00-4.27-1.77c-1.67 0-3.18.68-4.27 1.77s-1.77 2.6-1.77 4.27c0 1.67.68 3.18 1.77 4.27a6.023 6.023 0 004.27 1.77c1.67 0 3.18-.68 4.27-1.77a6.023 6.023 0 001.77-4.27c0-1.67-.67-3.18-1.77-4.27zm45.42 78.29a6.023 6.023 0 00-4.27-1.77c-1.67 0-3.18.68-4.27 1.77a6.023 6.023 0 00-1.77 4.27c0 1.67.68 3.18 1.77 4.27a6.023 6.023 0 004.27 1.77c1.67 0 3.18-.68 4.27-1.77a6.023 6.023 0 001.77-4.27c0-1.67-.67-3.18-1.77-4.27zm-90.6 0c-1.09-1.09-2.6-1.77-4.27-1.77s-3.18.68-4.27 1.77a6.023 6.023 0 00-1.77 4.27c0 1.67.68 3.18 1.77 4.27s2.6 1.77 4.27 1.77 3.18-.68 4.27-1.77a6.023 6.023 0 001.77-4.27 6.065 6.065 0 00-1.77-4.27zm80.95-45.22c.08.08.14.18.2.28.06.1.1.2.14.31.23.34.49.66.77.95a6.023 6.023 0 004.27 1.77c1.67 0 3.18-.68 4.27-1.77a6.023 6.023 0 001.77-4.27c0-1.67-.68-3.18-1.77-4.27a6.023 6.023 0 00-4.27-1.77c-1.67 0-3.18.68-4.27 1.77a6.023 6.023 0 00-1.77 4.27c.01.99.25 1.91.66 2.73zM35.41 71.49a1.687 1.687 0 01.43.88l17.13 10.07V62.56L35.41 52.11v19.38zm37.56-19.11L55.96 62.57v19.89l17.01-10.05V52.38zM54.39 39.99l-16.6 9.93 16.69 10.05 16.21-9.84-16.3-10.14z" fill-rule="evenodd" clip-rule="evenodd" /></svg>,
  description: 'Badge-gate anything with Blockin: a universal, multi-chain Web3 sign-in standard with native badge verification support.',
  createdBy: 'Blockin',
  toolType: 'Verification',
  communityBuilt: true
},
{
  name: 'Mailchimp',
  url: 'https://mailchimp.com/',
  icon: <img style={{ height: 'auto' }} src="https://s3.amazonaws.com/www-inside-design/uploads/2018/10/mailchimp-sq.jpg" alt="Mailchimp" />,
  description: 'Distribute claim codes via email or SMS with Mailchimp.',
  createdBy: 'Mailchimp',
  toolType: 'Distribution',
  communityBuilt: true
},

{
  name: 'Twilio',
  url: 'https://www.twilio.com/',
  icon: <img style={{ height: 'auto' }} src="https://www.vectorlogo.zone/logos/twilio/twilio-icon.svg" alt="Twilio" />,
  description: 'Distribute claim codes via email or SMS with Twilio.',
  createdBy: 'Twilio',
  toolType: 'Distribution',
  communityBuilt: true
},
{
  name: 'Rafflecopter',
  url: 'https://www.rafflecopter.com/',
  icon: <img style={{ height: 'auto' }} src="https://2.bp.blogspot.com/-_NSxLoZu4Hg/U9ZRbXDnRrI/AAAAAAAAmwA/zA_s2fQYNho/s1600/rafflecopter_logo_name_0.png" alt="Rafflecopter" />,
  description: 'Run a raffle or giveaway with Rafflecopter. Distribute badges to the winner!',
  createdBy: 'RaffleCopter',
  toolType: 'Distribution',
  communityBuilt: true
},
{
  name: 'Paperform',
  url: 'https://paperform.co/',
  icon: <img style={{ height: 'auto' }} src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAOEAAADhCAMAAAAJbSJIAAAAxlBMVEX/sgQAAAD/tBQAAAP/swT/tgX/uAX3rgUEAQA4KgEAAAX/uwMlGAAeFgAAAAgCAATtqQTamwW/hwbTlgffnAWseATrpQYhGwVvTwPlogXRkwbxqgXXmga0gQXGiwffngQuJgEdFAUUDgaSaQQABwSCXAiebgViRAgbFgdBLwRVPwMpHgJROAJtTAYsGwWRYwaTbQNMNwNZRQN3vwaSawRJLQpQOABvSwozJAM9LwaGYQShdgSzfgepdQInHwIMCwFtUwUiHwI12scYAAAO40lEQVR4nO1daXubuBa2cnRErDQ4XuLGS+w6i7M1bTPp7fVNmmT6///UBQwYLYAAYXvm4f0wz8y0gF4fSefobGod/NvRatCgQYMGDRo0aNCgQYMGDRo0aNCgQYMGDRo0aNBg/0Fpgb+LBf7yXoAiOl00/us4OnXYP4mjJ5HxGfCZKUUcXQFcD/CfIkh6NFy2gYMxRZwvXEI43Myoudh3BzyanwEJADA2GTGObkmIux7uO0fE8T2BaMCcj1n+IyMXoieAPOw3R+rx4yQBTnKliPMrIjzS7tEiu/A2QY/697ARYCATT4rZ2wcOLqRHgH8dH+0lRRw+EhXAM6WIA8I1Dz1O9k93YOu7hp+/stx++lrEuST08BlClnumOSj2vmlkEQzXTZciTsFVCa4fa+dM7+0CJ48p/AK4fT1FOr3KeIpft/aFImXnnGcw5Nyd6iYqdjlPkWDwmHvb3w8x0slNxjjTpYjTtBm6wfd90BtstsgbZ7DdSOKg2M8SYPgcvxvtWv9TvHRzCRJ/ykknDdZ3s5Zu/Bzv7VZv4OQr0Wz3WnEIFLHvGj4HL7uUIutfGA3Th8sTaxHHbv4iDCmSr5OdcWTnpvQCXE2jkeIYjH8Zb6Z+GuxmT6X402gJRuhwCCcqG2eqCRXQ24UUKT4WGqWP9XaDY50tmk3xNf8UZp2gc2O6kmJ0COkixZlbTII++I9tT1R0norKIRjo1YDNivPzn7zeLkXqPF18KoPjL72rxXEZkOtt2jd08tdRSYzdYcknncftSdGT4Hu5lY8zgItBuY3RIc/bYkjxhrdLMfTXIPCLeRmK1OH8cktKA89cUoohzoJNA9xSFB1vu3ndipHKfnoGSRmGngTXDCUb1RCOv6NuQ/Wzc9+SKcGQ9WJTjZdZiz7DVHeBRWA/GGNxhmy2UYNAoDjFgCE5Pql5ntLJRTmGCQkGS7E4xTVD8p96dQbFX1CKIfbE0wSQj6JrMWRInms1Udll+JmCDFVTDfhHQSlGDMnvGil6RnMphqGakFBQaUQMOZ/XNk/p5DhyPRRiGKkJEZwUUxqxDOGuNobsv/FUK8JQXoMbjhdFKMYMCXyvaZ5622H8kQIM049LQA4LrEUn8WQZiyEfdJKYa+YMfWNbT5D47ilzikmGf2px+ONZGYaYeeAFcmUsjiRD/lLDPBWHasqQ9bJP9B1zA05gCAPrQqStVXJkhgxxlu+xcA03f0d46qt1hmwp7PhmDFnWGoykaKoXRYb83PJmQyfiUI0YpqoJEWBmwDnSY3bdNpQ9i683YWjqVesQIwNOZvjTqhBp1y0sw0w1IcJIacgM+dCmEFFOs8hnKKsJ70wIsP6nv6LhUPgzA4oyQ7i2KETal6WRy1BRE3Dzsux15/PRvDt7e7m5EDYucPMNOJkhISN7QlRDFHkMk1PUJfC/t24LGSINgN6/tgavdyT5I+QqDZXhsz0hdpVEhByGgppY/RgyVHY+xKPJcqNjO4TnKA2VoWttJbL/Ki/PZphQE/ypR9NcgBTp7GnzU+QYcCpDa8d9OlSPd1kMaWKTue1lp4wizh4gkqK3FjOEomEIEztCZC/qrp/FMJYg8O/5KbGIsbXkZk5UHcNLK0Kkk4Ua681guCG46pq4qCmb362z27KVho7hZ8eGEPFUfXUGw42aeHQM9zp0rtcGBbgZBpyGISFWrFP6VIRhrCaggFVF8RXCqQqpSkPL8N4CQ9rV2V5pDDe26Gkhz63vIfEf7EDqWtQyTP9BzIEvOkdZCsPNGizq1PQoht+Rs6ci6Bl+ry5ECuYMMVyDQN6KxzXO179NJ80brmXIeXUZOpqdNIXhRtGXcfexH2GmW8pJQ8/w2Cn+JQl08sVPEzFg6EkwGCLwm1KnU3YWzjy9AadhyEl7UuJDMujwwUiGsZrgF+VMDeqEZiq4h1OVok4ftu3E2vDkVpGiyjCeoty83kl+xTi29q66ytAVhhzebeX00ZPjXBluFD2clf4su45sVI3SUGW4smSWtvzCnXdpQ5UZJp1O5c801OnE33FlKUoMgbftEfQpHosJrxJDjCXYIT8qzBx8jRgGJw3hz0SGACurfhq//MpNZ7ghSOCiijFMnffNMpOCbyJD99imBH3gcJGUosAwUhPBuKpl9eBb/An51C949T01YT38hPPjFIaC06nioZROPuJ3gQtJpSEwtKQmRODoUMtQ9Gz/VfFMyp6T6/1juiGyYchhVU/qt7cWNQwlt2HVpCUcJ97WSa7FhAwfbK/B+OvzRcQmZoi9JD/uVg5dIhGwOWlsMhWsqgnp6/OoHDJiiKIE+WPl2RNZp6EUSWzAhQyB1LIGI+A8LKcLGUoECSwru4bwtyhEHhUxrBmC+35SZ2ob9UsiOzHDpJpYD0c1Jwt/YigGdDokLGIIGHKbppoe2A0iDgFDNYT9Ud3OoK2OFPAIlcaaYQ16UAZOua9wmTYAemchbEnlKgDwlAauM2jrl6AP7LqBDHVJCFW1oQ85GBsojTlSX4aftkEwoMjbTFQTIc5sMNS42H2l4dSqJkRg320f9XQOKhuVdLhUGXb8PaxeNSENot/Wh7BtJNMnjO8E+MV4C5tMDL+2WRujX9pgqIsieFK83Wb5Ouu9D7RFrjZiQfim+/H4anBYT76edgw9aB/1daVrNpIH9Ovwy7BFdB64WuCpCU9boJyA4qO8Eyrx+heNCC9O/JqZmrIuZWCPBBUlrKtO1Hsb2uJMfitwzxb19SGkxTSswt9kQptGnajt6hFL2rpTJBg4nRyS2ynFCvA8OD+t7dK+kqNhwf/lyHrI/TPc2KWuQdeiSvBbYBASny3ktcin1WU4kHOpbtc/m7P+L15vsww8F8/4KK9FC+dDSR3yh9CSCc+H9U5UPJe8GFRai3BT/YwvpND5akI+45eOixh8/Dxms/HTiBPVgp9GnBS3sS26qbdwZzWtRfytq0ZgIsXKvrZk9QnAnxOdr43UI0V2qvcIixO1sr80WRFAkrEJwSPcq0GKAkHR551UGlV93icfiSn/PkrxeQPYp3h0mp7JnlyLvNpuyl7j6AhIXh8hMgPWpcgkg1+KPW2UBl9USR1I1jzEaiKEFD+0nKyPp5DFMKE0gLxWiR/G/WASaiKEHCEFmxS9uSNBiQH345jGcQXblC7iH/KzbACqcfxzaxNV41dQ4/jRWgS3vCuDLWMBfVY822ocH37bkSJVJajNxYi3m9K5ZolU3ZXqdNLl05xakSIu1Vfr8mkwVhp3JX9aeh++3f2iaWKmy4mCt5qcCik5UbEUy7lrov06Pk2I0Gd9VdnXQpzoXpyS1xYpDShjOGI/Sjl60EaXtAwJnBT/kgiKX40ZbvrodYoXe9CT8NdR1EQIffblfeXTIqW/dW9Oyy8NlUbxBGzqtMNV/C3FT6CfpRaUIp18aN6cmiMcrcWCHhvqPIUSvE0LgGoZVsreiYDXBRhGVW4dUihdgjp3oQQfUmMTWoZWWg7SqSZEkZ6rHykN/s28bSUOV+Emo1MTIXTZl1A95hx8/6lQRUm03UBnbNYRiLLxcbhDKaZaAjqGv+zYbbpIYWbNTFQIxn+abHQUl6GS4aqploCOoa2zPlsUYkhxGjms7nJ7OlI2uo8UfYqaCKFh+NmW6a2Jd+XUrkWHKQ6Xmbc6UOZc8miZP2S7kzUMLVne/rn0sGD9YRDrX2OxTL2dw/uD02h6ZKiJECrDhb3eEUw5PuXVkCZLo/nLiDI5ScOvJB39TPSQTlcTIVSGp/aOwNSRE71z64Ax6Z7iT8uBw1hYJBuUyTrzt6+JnE2evQZ9KAzfrRSuReOVT1AGtdwJJ6Nfxf3l5nI2Hgwnk+FgPFs+tsUW4A+5BFWGdg6HIejBIstPowUq1cN+51nw/ylrH/fWIMtC9tN8sxugYefiaA0YUo+iNp1B/p++mjAYrexrm9nO8xZamxj2xdDG+lXGZln3UuePJ9stFHFcnKE/UfP5kUxLZgOpGsF+gxqxcYRhfxqln4YGnwwznUSfdw1NhuioTI8hVAPhoij4F9OEWCFu8bmODDfBJWXeJypnLeaYagnUHnvyrJDEZlOg15facmID98I8pTnJ8K96osA4KMOwlaY0AjVRwBGQYMhtWjMJUHapRrkNkHqThacmyvXcq60TLT24gxIMU24jAfJehGDMENy/60vGoHNehqGadxNgUSwhNpbhJ9NeDWXAfpdiqNluCqiJECFDuWjPNtgZlGGoURqFCyQjhsVL/Qshqrcu3EdYkqJ7XLjyJWT4WHNeWwtHnVIMBaVRdJMJsM7cu6v/mqt1Sk+Jft4JA46vStQuBQwXdot/taDsNcwvLYrYVVxGggFD4FvJg6b4UkqGG6VRrueCs737ZiieueXuRvC3G15YTYRwgG/tthlKbx4YLQOcgq8mSsEp0rWoMsWDv4+wFI4Gqwkr9+jJyzZvmqH0F3QOSwBWMxdKPUi2SjCYqKXuCnoYodmVcsqTRnEsuxSfza6GS6BDPo8oNb5ULgl43f7FZIHSKDrOQF8nwjamsN412JDia6HpBvw2VPSZjg0dPuq/mSSF4kxtIJWB4zjJxq8lNp+osNrZRZYUR+/5AwzhJi9Bwikxv//wprUrgj5HR3ePs36kgiCwC5oOYrrH4HK3F8pS9mZ2n6h8jZXhWuQw2/n91ay7ym3bDcQjKN8lOz3MlyLclzmF2AY617kMdY3lqYHSWO7DfcC+OMZX2uaKIYKGAZrncO5m9TTn/M9gW2eJXHhizFpUHykNO/1mMBkMX3a5h8rwTDG18nMNcK9SD+bY/UibqXDX3/kWI4JSbaMAf6wZ7Y9xDvqJCm/5PZa3Dcqca41AlOuqReBcSUby+Z1N9kyAa1A2OJNF4vuOMseKAynLw9Pxv/Ztgm7gKTmpA3/+bX44vxKF3u7R/dARelDsPsb5Mtyofj7ZJI2Th9+4dwtQBKVs+BIpAdfIvYmj24hhu7fv/AJQNjl9As5d06rrdR84Tu5n+7eBpsAb6PQZzG/UxBHn8DzA3Z4iioFSPChwbqWjt8xM238BUrNsGzRo0KBBgwYNGjRo0KBBgwYNGjRo0KBBgwYNGjTYIxz8u0EP/g8Cr+Rj8AuRwAAAAABJRU5ErkJggg==" alt="Paperform" />,
  description: 'Collect addresses at an in-person event for your whitelists with Paperform.',
  createdBy: 'Paperform',
  toolType: 'Collect',
  communityBuilt: true
}]

export function ToolIcon({
  name
}: {
  name: string
}) {
  const tool = tools.find(tool => tool.name === name);

  if (!tool) {
    return null;
  }

  return (
    <Card hoverable style={{ margin: 8, maxWidth: 300, display: 'inline' }}
      className='primary-text card-bg tool-icon'
      onClick={() => {
        window.open(tool.url)
      }}
    >
      <div className='' style={{ alignItems: 'normal', width: '100%' }}>
        <div style={{ marginRight: 10 }} className='flex-around full-width'>
          <div>
            <Avatar size={40} src={tool.icon} shape='square' className='text-vivid-blue h-12' />
          </div>
          <div className='full-width primary-text' style={{ textAlign: 'center', alignItems: 'center' }}>
            <b style={{ marginLeft: 10, fontSize: 24 }}>
              {tool.name}
            </b>
          </div>

        </div>

        <div className='flex-center flex-column ' style={{ marginTop: 16 }}>
          <div className='secondary-text'>
            {tool.description}
          </div>
        </div>
      </div>
    </Card>
  );
}
