import React from 'react';
import type { ReportData } from '../ReportGenerator';
import type { PersonalInfo } from '../../../types';
import { useTranslations } from '../../../context/LanguageContext';

interface InvoiceProps {
    reportData: ReportData;
    personalInfo: Partial<PersonalInfo>;
    reportDate: Date;
}

// Simple number to words converter for Polish
function amountToWords(amount: number): string {
    const units = ["", "jeden", "dwa", "trzy", "cztery", "pięć", "sześć", "siedem", "osiem", "dziewięć"];
    const teens = ["dziesięć", "jedenaście", "dwanaście", "trzynaście", "czternaście", "piętnaście", "szesnaście", "siedemnaście", "osiemnaście", "dziewiętnaście"];
    const tens = ["", "dziesięć", "dwadzieścia", "trzydzieści", "czterdzieści", "pięćdziesiąt", "sześćdziesiąt", "siedemdziesiąt", "osiemdziesiąt", "dziewięćdziesiąt"];
    const hundreds = ["", "sto", "dwieście", "trzysta", "czterysta", "pięćset", "sześćset", "siedemset", "osiemset", "dziewięćset"];
    const thousands = [
        { one: "tysiąc", few: "tysiące", many: "tysięcy" },
        { one: "milion", few: "miliony", many: "milionów" },
    ];

    function convert(n: number): string {
        if (n < 10) return units[n];
        if (n < 20) return teens[n - 10];
        if (n < 100) return `${tens[Math.floor(n / 10)]} ${units[n % 10]}`;
        if (n < 1000) return `${hundreds[Math.floor(n / 100)]} ${convert(n % 100)}`;
        return '';
    }

    let words = [];
    let num = Math.floor(amount);

    if (num === 0) words.push("zero");
    
    for (let i = 0; num > 0; i++) {
        let chunk = num % 1000;
        if (chunk > 0) {
            let chunkWords = convert(chunk);
            if (i > 0) {
                let form;
                if (chunk === 1) form = thousands[i - 1].one;
                else if ([2, 3, 4].includes(chunk % 10) && ![12, 13, 14].includes(chunk % 100)) form = thousands[i-1].few;
                else form = thousands[i-1].many;
                words.unshift(`${chunkWords} ${form}`);
            } else {
                words.unshift(chunkWords);
            }
        }
        num = Math.floor(num / 1000);
    }

    const zlotyPart = words.join(' ').trim();
    const grosz = Math.round((amount * 100) % 100);

    return `${zlotyPart} zł ${grosz}/100`;
}

const Invoice: React.FC<InvoiceProps> = ({ reportData, personalInfo, reportDate }) => {
    const { t } = useTranslations();
    const safeDate = reportDate || new Date();
    const monthName = safeDate.toLocaleString('pl', { month: 'long' }).toUpperCase();
    const year = safeDate.getFullYear();
    const today = new Date().toLocaleDateString('pl-PL');

    return (
        <div style={{ fontFamily: 'Arial, sans-serif', fontSize: '12pt', lineHeight: 1.5 }}>
            <div style={{ textAlign: 'right', marginBottom: '30px' }}>
                <p>Warszawa, dnia {today}</p>
            </div>
             <div style={{ margin: '20px 0', lineHeight: 2 }}>
                <ul style={{ listStyle: 'none', padding: 0 }}>
                    <li>• NAZWISKO: <strong>{personalInfo.fullName?.split(' ')[1]?.toUpperCase()}</strong></li>
                    <li>• IMIĘ (imiona): <strong>{personalInfo.fullName?.split(' ')[0]?.toUpperCase()}</strong></li>
                    <li>• NR PESEL: <strong>{personalInfo.pesel}</strong></li>
                    <li>• Miejscowość (kod pocztowy): <strong>{personalInfo.addressCity}</strong></li>
                    <li>• Ulica (nr domu i mieszkania): <strong>{personalInfo.addressStreet}</strong></li>
                    <li>• Województwo/gmina/dzielnica: <strong>{personalInfo.addressProvince}</strong></li>
                    <li>• Adres mailowy: <strong>{personalInfo.email}</strong></li>
                    <li>• Nr telefonu: <strong>{personalInfo.phone}</strong></li>
                    <li>• Urząd Skarbowy: <strong>{personalInfo.taxOffice}</strong></li>
                </ul>
            </div>

            <div style={{ fontWeight: 'bold', margin: '30px 0', fontSize: '14pt' }}>
                RACHUNEK DO UMOWY ZLECENIA nr {personalInfo.contractNumber}
            </div>

             <div style={{ margin: '20px 0' }}>
                <p><strong>MIESIĄC {monthName} ROK {year}</strong></p>
                <p style={{ marginTop: '10px' }}>dla UCK WUM, ul. Banacha 1a, 02-097 Warszawa,</p>
                <p style={{ marginTop: '10px' }}>za wykonywanie zadań:</p>
                <p><strong>{personalInfo.specialty?.toUpperCase()}</strong></p>
            </div>

            <div style={{ margin: '30px 0', padding: '15px', background: '#f9f9f9', border: '1px solid #ddd' }}>
                 <p style={{ fontSize: '14pt', fontWeight: 'bold' }}>Kwota złotych: {reportData.totalAmount.toLocaleString('pl-PL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} zł brutto</p>
                 <p style={{ marginTop: '10px' }}>(słownie złotych: {amountToWords(reportData.totalAmount)})</p>
            </div>

            <div style={{ margin: '30px 0' }}>
                <p>Wynagrodzenie proszę wypłacić przelewem na rachunek bankowy nr:</p>
                <p style={{ fontSize: '14pt', fontWeight: 'bold', marginTop: '10px' }}>{personalInfo.bankAccount}</p>
            </div>

            <div style={{ marginTop: '80px', textAlign: 'center' }}>
                <div style={{ display: 'inline-block', border: '1px solid #000', padding: '10px 20px' }}>
                    <p><strong>{personalInfo.fullName}</strong></p>
                    <p><strong>{personalInfo.specialty}</strong></p>
                    <p>{personalInfo.licenseNumber}</p>
                </div>
            </div>

            <div style={{ marginTop: '100px' }}>
                <div style={{ borderBottom: '1px dotted #000', width: '300px', margin: '0 auto' }}></div>
                <p style={{ textAlign: 'center', marginTop: '10px' }}>(czytelny podpis Zleceniobiorcy)</p>
            </div>
        </div>
    );
};

export default Invoice;
