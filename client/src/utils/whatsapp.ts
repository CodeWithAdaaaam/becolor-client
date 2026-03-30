// client/src/utils/whatsapp.ts

export const formatPhoneNumber = (phone: string) => {
  if (!phone) return '';
  // Enlever les espaces, tirets, parenthèses
  let cleanPhone = phone.replace(/\D/g, '');

  // Remplacer le 0 initial par 212 (Indicatif Maroc)
  if (cleanPhone.startsWith('0')) {
    cleanPhone = '212' + cleanPhone.substring(1);
  }
  
  return cleanPhone;
};

export const createWhatsAppLink = (phone: string, message: string) => {
  const cleanPhone = formatPhoneNumber(phone);
  const encodedMessage = encodeURIComponent(message);
  return `https://wa.me/${cleanPhone}?text=${encodedMessage}`;
};

// TEMPLATES DE MESSAGES (Selon ton Cahier des Charges)
export const getMessageTemplates = (rdv: any) => {
  const dateStr = new Date(rdv.heure_debut).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' });
  const heureStr = new Date(rdv.heure_debut).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  const clientName = rdv.client.prenom;
  const serviceName = rdv.service.nom;

  return {
    confirmation: `Bonjour ${clientName} 👋, votre RDV chez be COLOR est confirmé pour le ${dateStr} à ${heureStr} (${serviceName}). À très vite !`,
    rappel: `Bonjour ${clientName}, petit rappel pour votre RDV demain à ${heureStr} chez be COLOR. Merci de confirmer votre présence. 💇‍♀️`,
    annulation: `Bonjour ${clientName}, votre RDV du ${dateStr} a bien été annulé. N'hésitez pas à reprendre rendez-vous sur notre site.`,
    retard: `Bonjour ${clientName}, nous remarquons un petit retard. Êtes-vous toujours en chemin ?`
  };
};