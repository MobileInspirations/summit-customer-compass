
export const getEngagementBadgeVariant = (level?: string) => {
  switch (level) {
    case 'H': return 'destructive';
    case 'M': return 'default';
    case 'L': return 'secondary';
    case 'U': return 'outline';
    default: return 'secondary';
  }
};

export const getEngagementLabel = (level?: string) => {
  switch (level) {
    case 'H': return 'High';
    case 'M': return 'Medium';
    case 'L': return 'Low';
    case 'U': return 'Unengaged';
    default: return 'Unknown';
  }
};

export const getMainBucketLabel = (bucket?: string) => {
  console.log('Raw bucket value:', bucket); // Debug log
  // Normalize all business operations variants
  if (bucket === 'biz-op' || bucket === 'biz' || bucket === 'Business Operations' || bucket === 'business operations') {
    return 'Business Operations';
  } else if (bucket === 'health' || bucket === 'Health') {
    return 'Health';
  } else if (bucket === 'survivalist' || bucket === 'Survivalist') {
    return 'Survivalist';
  } else if (bucket === 'cannot-place' || bucket === 'Cannot Place') {
    return 'Cannot Place';
  } else {
    console.warn('Unknown bucket value:', bucket); // Debug log
    return bucket || 'Unknown';
  }
};

export const getMainBucketVariant = (bucket?: string) => {
  // Normalize all business operations variants
  if (bucket === 'biz-op' || bucket === 'biz' || bucket === 'Business Operations' || bucket === 'business operations') {
    return 'default';
  } else if (bucket === 'health' || bucket === 'Health') {
    return 'secondary';
  } else if (bucket === 'survivalist' || bucket === 'Survivalist') {
    return 'outline';
  } else {
    return 'outline';
  }
};

export const exportContactsToCSV = (contacts: any[]) => {
  const csvHeaders = "ID,Name,Email,Company,Engagement Level,Summit History,Main Bucket,Created Date,Updated Date\n";
  const csvRows = contacts.map(contact => {
    const summitHistoryString = contact.summit_history ? contact.summit_history.join(';') : '';
    
    return `"${contact.id}","${contact.full_name || ''}","${contact.email}","${contact.company || ''}","${contact.engagement_level || ''}","${summitHistoryString}","${contact.main_bucket || ''}","${contact.created_at}","${contact.updated_at}"`;
  }).join("\n");
  
  const csvContent = csvHeaders + csvRows;
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", `all_contacts_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
