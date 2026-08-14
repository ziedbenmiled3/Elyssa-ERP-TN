sed -i '6839,$d' src/App.tsx
cat << 'INNER_EOF' >> src/App.tsx
        </AnimatePresence>
      </div>
      <CopilotChatDrawer isOpen={copilot.isChatOpen} onClose={copilot.closeChat} companyId={activeCompanyName} />
      <button onClick={copilot.toggleChat} className="fixed bottom-6 right-6 z-40 p-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 group">
        <MessageSquare className="w-6 h-6" />
      </button>
    </div>
  );
}
INNER_EOF
