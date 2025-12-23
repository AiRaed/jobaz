export interface Job {
  id: string
  title: string
  company: string
  location: string
  description: string
  type: string
  requirements?: string
  duties?: string
  skills?: string
  link?: string
}

// Mock job data
export const mockJobs: Job[] = [
  {
    id: '1',
    title: 'Customer Service Assistant',
    company: 'Tesco',
    location: 'London, UK',
    description: 'Assist customers, handle inquiries and support store operations.',
    type: 'Full-time',
    requirements: 'Previous customer service experience preferred. Excellent communication skills. Ability to work in a fast-paced environment. Basic computer skills.',
    duties: 'Assist customers with inquiries and complaints. Process returns and exchanges. Maintain store cleanliness and organization. Handle cash transactions accurately.',
    skills: 'Customer service, Communication, Problem-solving, Teamwork, Time management',
    link: 'https://www.tesco.com/careers',
  },
  {
    id: '2',
    title: 'Sales Advisor',
    company: 'H&M',
    location: 'Newcastle, UK',
    description: 'Support customers on the shop floor and drive sales.',
    type: 'Part-time',
    requirements: 'No previous experience required. Friendly and approachable personality. Willingness to learn. Flexible availability including weekends.',
    duties: 'Help customers locate products and answer questions. Process transactions at checkout. Restock shelves and maintain displays. Keep the store clean and organized.',
    skills: 'Sales, Customer service, Product knowledge, Cash handling, Organization',
    link: 'https://careers.hm.com',
  },
  {
    id: '3',
    title: 'Call Center Representative',
    company: 'Customer Support Solutions',
    location: 'Manchester, UK',
    description: 'Handle inbound customer calls, resolve issues, and provide excellent service.',
    type: 'Full-time',
    requirements: 'Strong communication skills. Ability to work in a call center environment. Basic computer literacy. Customer-focused attitude.',
    duties: 'Answer customer inquiries via phone. Resolve complaints and issues. Process orders and returns. Maintain accurate records of interactions.',
    skills: 'Customer service, Phone communication, Problem-solving, Data entry, Patience',
    link: 'https://example.com/careers',
  },
  {
    id: '4',
    title: 'Warehouse Operative',
    company: 'Logistics Plus',
    location: 'Birmingham, UK',
    description: 'Work in a fast-paced warehouse environment, picking, packing, and shipping orders.',
    type: 'Full-time',
    requirements: 'Physical fitness for lifting and moving packages. Attention to detail. Ability to work in a team. Forklift license preferred but not required.',
    duties: 'Pick and pack orders accurately. Load and unload delivery vehicles. Maintain warehouse organization. Follow safety procedures.',
    skills: 'Physical fitness, Attention to detail, Teamwork, Time management, Safety awareness',
    link: 'https://example.com/careers',
  },
  {
    id: '5',
    title: 'Administrative Assistant',
    company: 'Office Solutions Ltd',
    location: 'Leeds, UK',
    description: 'Provide administrative support to the office team, manage documents, and coordinate schedules.',
    type: 'Part-time',
    requirements: 'Proficient in Microsoft Office. Excellent organizational skills. Strong written and verbal communication. Previous admin experience preferred.',
    duties: 'Answer phones and direct calls. Manage filing systems. Schedule appointments and meetings. Prepare documents and reports.',
    skills: 'Administration, Microsoft Office, Organization, Communication, Time management',
    link: 'https://example.com/careers',
  },
  {
    id: '6',
    title: 'Retail Assistant',
    company: 'Tesco',
    location: 'Birmingham, UK',
    description: 'Support daily store operations, assist customers, and maintain store standards.',
    type: 'Part-time',
    requirements: 'Customer service skills. Ability to work flexible hours including weekends. Friendly and approachable. No previous experience required.',
    duties: 'Assist customers with product inquiries. Operate cash registers. Restock shelves. Maintain store cleanliness.',
    skills: 'Customer service, Cash handling, Product knowledge, Teamwork, Flexibility',
    link: 'https://www.tesco.com/careers',
  },
]

