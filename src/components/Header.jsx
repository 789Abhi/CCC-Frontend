import React from "react";
import logo from "/CCC-Logo.svg"; 
function Header() {
  return (
    <section>
      <div className="flex gap-4">
        <div className="h-[69px]">
          <img className="h-full object-contain" src={logo} alt="CCC Logo" />
        </div>
        <div className="bg-customGray rounded-custom flex-1 py-3 px-3 flex justify-center items-center">
          <h1 className="text-bgPrimary font-bold lg:text-[30px] text-lg text-center">New Version 2.0 Update 3-5-25</h1>
        </div>
      </div>
    </section>
  );
}

export default Header;
