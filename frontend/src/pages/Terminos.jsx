import React from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import SEO from '../components/SEO';

function Section({ id, title, children }) {
  return (
    <section id={id} className="mb-8">
      <h2 className="text-lg font-bold text-gray-900 mb-3 pb-2 border-b border-gray-200">{title}</h2>
      <div className="space-y-3 text-gray-600 text-sm leading-relaxed">{children}</div>
    </section>
  );
}

export default function Terminos() {
  return (
    <div className="min-h-screen flex flex-col">
      <SEO
        title="Términos y Condiciones"
        description="Términos y Condiciones de uso de UrgenteYa.cl — Directorio de maestros independientes en Chile."
        url="/terminos"
        noindex
      />
      <Header />

      <div className="max-w-3xl mx-auto px-4 py-10 flex-1 w-full">
        <div className="mb-8">
          <Link to="/" className="text-gray-400 hover:text-gray-600 text-sm">← Volver al inicio</Link>
          <h1 className="text-2xl font-bold text-gray-900 mt-4">Términos y Condiciones de Uso</h1>
          <p className="text-sm text-gray-400 mt-1">Última actualización: {new Date().toLocaleDateString('es-CL', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
        </div>

        <div className="card p-6 sm:p-8">

          <Section title="1. Naturaleza del Servicio y Exención de Responsabilidad">
            <p>
              <strong>UrgenteYa.cl</strong> es una <strong>plataforma tecnológica de intermediación que funciona como directorio digital</strong>.
              Permite a personas naturales ("Maestros") publicar sus anuncios y datos de contacto, y a los Usuarios buscar
              y contactar directamente a dichos Maestros.
            </p>
            <p>
              UrgenteYa.cl <strong>no presta servicios de maestros, no selecciona ni recomienda Maestros de forma vinculante,
              no contrata ni representa a los Maestros, y no es parte de ningún contrato de servicios</strong> que se celebre
              entre un Maestro y un Usuario. El contrato de prestación de servicios se realiza <strong>exclusivamente entre
              el Usuario y el Maestro elegido</strong>.
            </p>
            <p><strong>UrgenteYa.cl no se hace responsable, bajo ninguna circunstancia, de:</strong></p>
            <ul className="list-disc list-inside space-y-1.5 pl-2">
              <li>La calidad, idoneidad, profesionalismo o resultado de los trabajos realizados por los Maestros.</li>
              <li>Cualquier daño material, personal, moral o económico causado por los Maestros.</li>
              <li>Accidentes, lesiones, fallecimientos o cualquier perjuicio derivado de los servicios.</li>
              <li>Estafas, cobros indebidos o conductas ilícitas de los Maestros.</li>
              <li>La veracidad de la información publicada por los Maestros ni de que cuenten con las licencias, certificaciones, seguros o habilitaciones legales requeridas.</li>
            </ul>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mt-2">
              <p className="text-amber-800 font-medium text-sm">
                El Usuario reconoce expresamente que contrata bajo su <strong>exclusivo riesgo y responsabilidad</strong>,
                y que es su obligación verificar por sí mismo las credenciales del Maestro antes de contratarlo.
              </p>
            </div>
          </Section>

          <Section title="2. Responsabilidad del Usuario">
            <p>
              El Usuario reconoce y acepta que <strong>contrata los servicios de un Maestro bajo su exclusivo riesgo y responsabilidad</strong>.
              Es obligación del Usuario verificar previamente las credenciales, referencias, antecedentes y habilitaciones del
              Maestro antes de contratar sus servicios.
            </p>
            <p>UrgenteYa.cl recomienda al Usuario:</p>
            <ul className="list-disc list-inside space-y-1.5 pl-2">
              <li>Solicitar cotización por escrito antes de autorizar cualquier trabajo.</li>
              <li>Verificar la identidad del Maestro antes de permitir su ingreso al domicilio.</li>
              <li>Exigir boleta o comprobante por los servicios prestados.</li>
              <li>No realizar pagos anticipados sin garantías.</li>
            </ul>
          </Section>

          <Section title="3. Para los Maestros">
            <p>
              Los Maestros que publican su perfil en UrgenteYa.cl declaran que la información proporcionada es verídica,
              que cuentan con las habilitaciones necesarias para prestar sus servicios, y que asumen <strong>plena y
              exclusiva responsabilidad</strong> por los trabajos que realizan.
            </p>
            <p>
              Al registrarte aceptas que eres el único responsable de los trabajos que realices.
              UrgenteYa.cl puede aprobar, rechazar o eliminar perfiles en cualquier momento, sin previo aviso ni reembolso.
            </p>
            <p>
              El Maestro se compromete a no utilizar la plataforma para realizar actividades ilícitas y a no proporcionar
              información falsa.
            </p>
          </Section>

          <Section title="4. Membresía y Pagos">
            <p>
              La publicación en UrgenteYa.cl está sujeta a un período de prueba gratuito de 30 días desde
              la aprobación del perfil. Transcurrido dicho período, la visibilidad del perfil queda condicionada
              al pago de una membresía mensual de acuerdo con el plan contratado.
            </p>
            <p>
              El no pago oportuno resulta en la <strong>suspensión automática de la visibilidad del perfil</strong>,
              sin que ello dé derecho a compensación. UrgenteYa.cl <strong>no garantiza un número mínimo de
              contactos, clientes ni ingresos</strong> al Maestro.
            </p>
            <p>
              Los valores de los planes pueden modificarse con aviso previo. Los pagos realizados no son reembolsables
              salvo que la plataforma deje de operar definitivamente.
            </p>
          </Section>

          <Section title="5. Contenido Publicado">
            <p>Queda estrictamente prohibido publicar:</p>
            <ul className="list-disc list-inside space-y-1.5 pl-2">
              <li>Información falsa, engañosa o que induzca a error.</li>
              <li>Contenido que infrinja derechos de terceros, normas legales o la moral.</li>
              <li>Datos de contacto de terceros sin su autorización.</li>
            </ul>
            <p>UrgenteYa.cl puede eliminar contenido que incumpla estas condiciones sin previo aviso.</p>
          </Section>

          <Section title="6. Modificaciones al Servicio">
            <p>
              UrgenteYa.cl se reserva el derecho de modificar, suspender o descontinuar el servicio en cualquier
              momento. Del mismo modo, puede modificar estos Términos y Condiciones. El uso continuado del sitio
              implica la aceptación de los términos vigentes.
            </p>
          </Section>

          <Section title="7. Ley Aplicable y Jurisdicción">
            <p>
              Estos Términos y Condiciones se rigen por la legislación vigente en la República de Chile.
              Cualquier controversia será sometida a los tribunales ordinarios de justicia de la ciudad de Santiago de Chile.
            </p>
          </Section>

          <Section id="privacidad" title="8. Política de Privacidad">
            <p>
              UrgenteYa.cl recopila y almacena los datos personales que los Maestros proporcionan voluntariamente
              al registrarse (nombre, teléfono, correo electrónico, comuna y descripción de servicios). Dicha
              información se utiliza exclusivamente para la operación del directorio y <strong>no se vende, cede ni
              comparte con terceros con fines comerciales</strong>.
            </p>
            <p>
              Los datos de los Maestros con perfil activo son públicos por la naturaleza del servicio (directorio).
              Los Maestros pueden solicitar la eliminación de sus datos enviando una solicitud al administrador,
              en cumplimiento de la <strong>Ley N° 19.628 sobre Protección de la Vida Privada</strong> y
              la Ley N° 21.719 de Protección de Datos Personales de Chile.
            </p>
            <p>
              Los Usuarios que utilizan el buscador no están obligados a registrarse y no se recopilan sus datos
              personales de forma activa.
            </p>
          </Section>

          <Section title="9. Contacto">
            <p>
              Operado por <strong>UrgenteYa.cl</strong> — sitio administrado por una persona natural.
            </p>
            <p>
              Para consultas, reclamos o solicitudes relacionadas con estos Términos, escríbenos a{' '}
              <a href="mailto:weburgenteya@gmail.com" className="text-brand-500 hover:underline">weburgenteya@gmail.com</a>.
            </p>
          </Section>

          <div className="mt-8 pt-6 border-t border-gray-200 text-xs text-gray-400 text-center">
            Al utilizar UrgenteYa.cl, Maestros y Usuarios declaran haber leído, entendido y aceptado
            íntegramente estos Términos y Condiciones.
          </div>

        </div>
      </div>

      <Footer />
    </div>
  );
}
