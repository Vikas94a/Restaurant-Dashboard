"use client";

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faShieldAlt, 
  faUser, 
  faEnvelope, 
  faPhone, 
  faLock,
  faEye,
  faDatabase,
  faExclamationTriangle,
  faCheckCircle
} from '@fortawesome/free-solid-svg-icons';

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 shadow-lg">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="text-center text-white">
            <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4">
              <FontAwesomeIcon icon={faShieldAlt} className="w-8 h-8" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold mb-2">Personvernerklæring</h1>
            <p className="text-blue-100 text-lg">Din personvern er viktig for oss</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          
          {/* Last Updated */}
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 px-6 py-4 border-b border-green-100">
            <div className="flex items-center">
              <FontAwesomeIcon icon={faCheckCircle} className="w-5 h-5 text-green-600 mr-2" />
              <p className="text-green-800 font-medium">Sist oppdatert: {new Date().toLocaleDateString('nb-NO')}</p>
            </div>
          </div>

          <div className="p-6 sm:p-8 space-y-8">
            
            {/* Introduction */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                <FontAwesomeIcon icon={faUser} className="w-6 h-6 text-blue-600 mr-3" />
                Introduksjon
              </h2>
              <div className="prose prose-gray max-w-none">
                <p className="text-gray-700 leading-relaxed mb-4">
                  Vi tar personvernet ditt på alvor. Denne personvernerklæringen beskriver hvordan vi samler inn, 
                  bruker og beskytter dine personlige opplysninger når du bruker vår tjeneste.
                </p>
                <p className="text-gray-700 leading-relaxed">
                  Ved å bruke vår tjeneste godtar du samlingen og bruken av informasjon i henhold til denne erklæringen.
                </p>
              </div>
            </section>

            {/* Information We Collect */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                <FontAwesomeIcon icon={faDatabase} className="w-6 h-6 text-blue-600 mr-3" />
                Informasjon vi samler inn
              </h2>
              <div className="bg-blue-50 rounded-xl p-6 border border-blue-100">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Personlige opplysninger</h3>
                <ul className="space-y-2 text-gray-700">
                  <li className="flex items-start">
                    <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    <span><strong>Navn:</strong> For å identifisere deg og personalisere tjenesten</span>
                  </li>
                  <li className="flex items-start">
                    <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    <span><strong>E-postadresse:</strong> For å sende bekreftelser og viktige oppdateringer</span>
                  </li>
                  <li className="flex items-start">
                    <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    <span><strong>Telefonnummer:</strong> For å kontakte deg ved behov</span>
                  </li>
                  <li className="flex items-start">
                    <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    <span><strong>Bestillingsdetaljer:</strong> For å behandle dine bestillinger og reservasjoner</span>
                  </li>
                </ul>
              </div>
            </section>

            {/* How We Use Information */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                <FontAwesomeIcon icon={faEye} className="w-6 h-6 text-blue-600 mr-3" />
                Hvordan vi bruker informasjonen
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-green-50 rounded-xl p-6 border border-green-100">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Hovedformål</h3>
                  <ul className="space-y-2 text-gray-700 text-sm">
                    <li>• Behandle dine bestillinger og reservasjoner</li>
                    <li>• Sende bekreftelser og oppdateringer</li>
                    <li>• Forbedre vår tjeneste</li>
                    <li>• Kommunisere med deg</li>
                  </ul>
                </div>
                <div className="bg-purple-50 rounded-xl p-6 border border-purple-100">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Sekundære formål</h3>
                  <ul className="space-y-2 text-gray-700 text-sm">
                    <li>• Analyse av bruksmønstre</li>
                    <li>• Forbedring av brukeropplevelsen</li>
                    <li>• Utvikling av nye funksjoner</li>
                    <li>• Markedsføring (kun med ditt samtykke)</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Data Protection */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                <FontAwesomeIcon icon={faLock} className="w-6 h-6 text-blue-600 mr-3" />
                Databeskyttelse
              </h2>
              <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-xl p-6 border border-orange-100">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Sikkerhetstiltak</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div className="flex items-center">
                      <FontAwesomeIcon icon={faCheckCircle} className="w-4 h-4 text-green-600 mr-2" />
                      <span className="text-gray-700 text-sm">SSL-kryptering for all dataoverføring</span>
                    </div>
                    <div className="flex items-center">
                      <FontAwesomeIcon icon={faCheckCircle} className="w-4 h-4 text-green-600 mr-2" />
                      <span className="text-gray-700 text-sm">Sikre servere og databaser</span>
                    </div>
                    <div className="flex items-center">
                      <FontAwesomeIcon icon={faCheckCircle} className="w-4 h-4 text-green-600 mr-2" />
                      <span className="text-gray-700 text-sm">Regelmessige sikkerhetsoppdateringer</span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center">
                      <FontAwesomeIcon icon={faCheckCircle} className="w-4 h-4 text-green-600 mr-2" />
                      <span className="text-gray-700 text-sm">Begrenset tilgang til personopplysninger</span>
                    </div>
                    <div className="flex items-center">
                      <FontAwesomeIcon icon={faCheckCircle} className="w-4 h-4 text-green-600 mr-2" />
                      <span className="text-gray-700 text-sm">Regelmessige sikkerhetsrevisjoner</span>
                    </div>
                    <div className="flex items-center">
                      <FontAwesomeIcon icon={faCheckCircle} className="w-4 h-4 text-green-600 mr-2" />
                      <span className="text-gray-700 text-sm">Automatisk backup og gjenoppretting</span>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Data Sharing */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                <FontAwesomeIcon icon={faExclamationTriangle} className="w-6 h-6 text-blue-600 mr-3" />
                Deling av opplysninger
              </h2>
              <div className="bg-yellow-50 rounded-xl p-6 border border-yellow-100">
                <p className="text-gray-700 leading-relaxed mb-4">
                  <strong>Vi deler ikke dine personlige opplysninger med tredjeparter</strong> bortsett fra i følgende tilfeller:
                </p>
                <ul className="space-y-2 text-gray-700">
                  <li className="flex items-start">
                    <span className="w-2 h-2 bg-yellow-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    <span>Når det er nødvendig for å fullføre din bestilling (f.eks. med restauranten)</span>
                  </li>
                  <li className="flex items-start">
                    <span className="w-2 h-2 bg-yellow-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    <span>Når vi er juridisk forpliktet til å gjøre det</span>
                  </li>
                  <li className="flex items-start">
                    <span className="w-2 h-2 bg-yellow-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    <span>Med ditt uttrykkelige samtykke</span>
                  </li>
                </ul>
              </div>
            </section>

            {/* Your Rights */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                <FontAwesomeIcon icon={faUser} className="w-6 h-6 text-blue-600 mr-3" />
                Dine rettigheter
              </h2>
              <div className="bg-indigo-50 rounded-xl p-6 border border-indigo-100">
                <p className="text-gray-700 leading-relaxed mb-4">
                  Du har følgende rettigheter vedrørende dine personlige opplysninger:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <ul className="space-y-2 text-gray-700">
                    <li>• <strong>Rett til innsyn:</strong> Se hvilke data vi har om deg</li>
                    <li>• <strong>Rett til retting:</strong> Få feil data rettet</li>
                    <li>• <strong>Rett til sletting:</strong> Få data slettet</li>
                    <li>• <strong>Rett til begrensning:</strong> Begrense behandlingen</li>
                  </ul>
                  <ul className="space-y-2 text-gray-700">
                    <li>• <strong>Rett til dataportabilitet:</strong> Få data i et strukturert format</li>
                    <li>• <strong>Rett til innsigelse:</strong> Protestere mot behandling</li>
                    <li>• <strong>Rett til å trekke samtykke:</strong> Når det gjelder samtykke</li>
                    <li>• <strong>Rett til klage:</strong> Klage til Datatilsynet</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Contact Information */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                <FontAwesomeIcon icon={faEnvelope} className="w-6 h-6 text-blue-600 mr-3" />
                Kontakt oss
              </h2>
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
                <p className="text-gray-700 leading-relaxed mb-6">
                  Hvis du har spørsmål om denne personvernerklæringen eller ønsker å utøve dine rettigheter, 
                  kan du kontakte oss:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white rounded-lg p-4 border border-blue-200">
                    <div className="flex items-center mb-2">
                      <FontAwesomeIcon icon={faEnvelope} className="w-5 h-5 text-blue-600 mr-2" />
                      <h3 className="font-semibold text-gray-900">E-post</h3>
                    </div>
                    <a 
                      href="mailto:Tredev.ranaberg@gmail.com"
                      className="text-blue-600 hover:text-blue-800 transition-colors"
                    >
                      Tredev.ranaberg@gmail.com
                    </a>
                  </div>
                  <div className="bg-white rounded-lg p-4 border border-blue-200">
                    <div className="flex items-center mb-2">
                      <FontAwesomeIcon icon={faPhone} className="w-5 h-5 text-blue-600 mr-2" />
                      <h3 className="font-semibold text-gray-900">Telefon</h3>
                    </div>
                    <a 
                      href="tel:+4794712904"
                      className="text-blue-600 hover:text-blue-800 transition-colors"
                    >
                      +47 947 12 904
                    </a>
                  </div>
                </div>
              </div>
            </section>

            {/* Changes to Policy */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                <FontAwesomeIcon icon={faExclamationTriangle} className="w-6 h-6 text-blue-600 mr-3" />
                Endringer i personvernerklæringen
              </h2>
              <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                <p className="text-gray-700 leading-relaxed">
                  Vi kan oppdatere denne personvernerklæringen fra tid til annen. Eventuelle endringer 
                  vil bli publisert på denne siden med en oppdatert dato. Vi oppfordrer deg til å 
                  gjennomgå denne erklæringen regelmessig for å holde deg informert om hvordan vi 
                  beskytter dine opplysninger.
                </p>
              </div>
            </section>

          </div>
        </div>
      </div>
    </div>
  );
}

